"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, query, where, Timestamp, orderBy, limit, doc } from "firebase/firestore";
import { useCollection, useDoc, useFirestore, useUser } from "@/firebase";
import type { CashRegister, FinancialMovement, Order, Supply, UserProfile } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, ClipboardList, HelpCircle, ShieldCheck, TrendingUp, Wrench } from "lucide-react";
import { getSyncStatusSnapshot, subscribeSyncStatus, type SyncStatusSnapshot } from "@/lib/sync-status-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ReconcileHistoryItem = {
  id: number;
  machine_id: string | null;
  is_consistent: boolean;
  mismatches_count: number;
  created_at: string;
};

function CardTitleHelp({
  icon: Icon,
  title,
  help,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  help: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5" />
      <span>{title}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={`Ajuda: ${title}`}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{help}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

export default function OperationsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [syncStatus, setSyncStatus] = useState<SyncStatusSnapshot>(getSyncStatusSnapshot());
  const [history, setHistory] = useState<ReconcileHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [simPrice, setSimPrice] = useState("35");
  const [simCost, setSimCost] = useState("12");
  const [simCostDelta, setSimCostDelta] = useState("10");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const ordersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "orders"), where("createdAt", ">=", Timestamp.fromDate(today)));
  }, [firestore, user, today]);
  const { data: todayOrdersData } = useCollection<Order>(ordersQuery);

  const suppliesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "supplies"), where("isActive", "==", true));
  }, [firestore, user]);
  const { data: suppliesData } = useCollection<Supply>(suppliesQuery);

  const userProfileRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const cashRegisterRef = useMemo(() => {
    if (!firestore || !user?.uid || !userProfile?.activeCashRegisterId) return null;
    return doc(firestore, `users/${user.uid}/cash_registers`, userProfile.activeCashRegisterId);
  }, [firestore, user, userProfile]);
  const { data: activeCashRegister } = useDoc<CashRegister>(cashRegisterRef);

  const movementsQuery = useMemo(() => {
    if (!firestore || !user || !activeCashRegister) return null;
    return query(
      collection(firestore, `users/${user.uid}/cash_registers/${activeCashRegister.id}/financial_movements`),
      orderBy("movementDate", "desc"),
      limit(200)
    );
  }, [firestore, user, activeCashRegister]);
  const { data: movementsData } = useCollection<FinancialMovement>(movementsQuery);

  const todayOrders = todayOrdersData || [];
  const supplies = suppliesData || [];
  const movements = movementsData || [];

  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

  useEffect(() => {
    const run = async () => {
      try {
        setIsHistoryLoading(true);
        setHistoryError(null);
        const base = process.env.NEXT_PUBLIC_SYNC_SERVER || "http://localhost:4000";
        const apiKey = process.env.NEXT_PUBLIC_SYNC_API_KEY;
        const response = await fetch(`${base}/api/sync/reconcile/history?limit=8`, {
          headers: apiKey ? { "x-api-key": apiKey } : undefined,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        setHistory(payload.data || []);
      } catch (error) {
        setHistoryError(error instanceof Error ? error.message : "Falha ao carregar histórico");
      } finally {
        setIsHistoryLoading(false);
      }
    };
    run();
  }, []);

  const replenishment = useMemo(() => {
    return supplies
      .filter((s) => s.minStock > 0)
      .map((s) => {
        const ratio = s.minStock > 0 ? s.stock / s.minStock : 0;
        const daysLeft = Math.max(0, Math.round((ratio * 7)));
        const severity = ratio <= 0.6 ? "critical" : ratio <= 1 ? "warning" : "ok";
        return {
          id: s.id,
          name: s.name,
          stock: s.stock,
          minStock: s.minStock,
          unit: s.unit,
          suggestedOrder: Math.max(0, Math.ceil(s.minStock * 1.5 - s.stock)),
          daysLeft,
          severity,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 8);
  }, [supplies]);

  const actionableAlerts = useMemo(() => {
    const lowStockCount = replenishment.filter((r) => r.severity !== "ok").length;
    const inconsistentCount = history.filter((h) => !h.is_consistent).length;
    const ordersPending = todayOrders.filter((o) => o.status === "Pendente" || o.status === "Em Preparo").length;

    return [
      {
        id: "stock",
        title: "Reposição de estoque",
        description: `${lowStockCount} insumo(s) abaixo do ideal`,
        actionHref: "/admin/inventory",
        actionLabel: "Abrir estoque",
        critical: lowStockCount > 0,
      },
      {
        id: "sync",
        title: "Saúde da sincronização",
        description: `${inconsistentCount} reconciliação(ões) recentes com divergência`,
        actionHref: "/admin/operations",
        actionLabel: "Ver auditoria",
        critical: inconsistentCount > 0 || syncStatus.health === "error",
      },
      {
        id: "orders",
        title: "Fila de pedidos",
        description: `${ordersPending} pedido(s) pendente(s) hoje`,
        actionHref: "/admin/orders",
        actionLabel: "Ir para pedidos",
        critical: ordersPending >= 5,
      },
    ];
  }, [replenishment, history, todayOrders, syncStatus.health]);

  const simulator = useMemo(() => {
    const price = Number(simPrice) || 0;
    const cost = Number(simCost) || 0;
    const delta = Number(simCostDelta) || 0;
    const adjustedCost = cost * (1 + delta / 100);
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    const adjustedMargin = price > 0 ? ((price - adjustedCost) / price) * 100 : 0;
    return { margin, adjustedMargin, adjustedCost };
  }, [simPrice, simCost, simCostDelta]);

  const healthItems = useMemo(() => {
    const syncLabel =
      syncStatus.health === "ok"
        ? "Sincronizado"
        : syncStatus.health === "syncing"
          ? "Sincronizando"
          : syncStatus.health === "warning"
            ? "Com divergência"
            : syncStatus.health === "error"
              ? "Erro/Offline"
              : "Aguardando";

    const latest = history[0];
    return [
      {
        label: "Sync atual",
        value: syncLabel,
        ok: syncStatus.health === "ok" || syncStatus.health === "idle",
      },
      {
        label: "Última reconciliação",
        value: latest ? (latest.is_consistent ? "Consistente" : "Divergente") : "N/A",
        ok: latest ? latest.is_consistent : true,
      },
      {
        label: "Último erro",
        value: syncStatus.lastErrorMessage || "Nenhum",
        ok: !syncStatus.lastErrorMessage,
      },
    ];
  }, [syncStatus, history]);

  const dailyClose = useMemo(() => {
    const doneOrders = todayOrders.filter((o) => o.status === "Entregue" || o.status === "Pronto para Retirada");
    const sales = doneOrders.reduce((sum, o) => sum + o.total, 0);
    const cost = doneOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const grossProfit = sales - cost;
    const incomes = movements.filter((m) => m.type === "income").reduce((s, m) => s + m.amount, 0);
    const expenses = movements.filter((m) => m.type === "expense").reduce((s, m) => s + m.amount, 0);
    const netCash = incomes - expenses;

    const recommendations: string[] = [];
    if (grossProfit < 0) recommendations.push("Lucro bruto negativo hoje: revise preço/custo de itens vendidos.");
    if (netCash < 0) recommendations.push("Caixa líquido negativo: revisar despesas e lançamentos.");
    if (doneOrders.length === 0) recommendations.push("Sem pedidos concluídos hoje: confirme operação/horário.");
    if (recommendations.length === 0) recommendations.push("Operação saudável hoje.");

    return { sales, grossProfit, netCash, doneOrders: doneOrders.length, recommendations };
  }, [todayOrders, movements]);

  const lastHistory = history[0];
  const inconsistentRecent = history.filter((h) => !h.is_consistent).length;

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Operações Inteligentes</h1>
        <p className="text-muted-foreground mt-2">
          Use esta página para decidir rápido: o que comprar, o que corrigir e como fechar o dia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              <CardTitleHelp
                icon={TrendingUp}
                title="O que comprar hoje"
                help="Mostra os itens com maior risco de faltar e sugere quantidade de compra."
              />
            </CardTitle>
            <CardDescription>Itens com risco de faltar, com sugestão de quantidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Priorize os itens com menor número de dias restantes.</p>
            {replenishment.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.stock}/{item.minStock} {item.unit} · sugerido comprar {item.suggestedOrder}
                  </p>
                </div>
                <Badge variant={item.severity === "critical" ? "destructive" : item.severity === "warning" ? "secondary" : "outline"}>
                  {item.daysLeft}d
                </Badge>
              </div>
            ))}
            <Button asChild className="w-full mt-2"><Link href="/admin/inventory">Gerar ação no estoque</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CardTitleHelp
                icon={AlertTriangle}
                title="Prioridades agora"
                help="Lista o que precisa de ação imediata e já oferece botão direto para resolver."
              />
            </CardTitle>
            <CardDescription>O que exige ação imediata, com atalho direto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionableAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                <Button size="sm" variant={alert.critical ? "default" : "outline"} asChild>
                  <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CardTitleHelp
                icon={Wrench}
                title="Simular preço e margem"
                help="Teste cenários de preço e custo antes de alterar produtos no catálogo."
              />
            </CardTitle>
            <CardDescription>Teste cenários antes de alterar preço no catálogo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="sim-price">Preço</Label>
                <Input id="sim-price" value={simPrice} onChange={(e) => setSimPrice(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sim-cost">Custo</Label>
                <Input id="sim-cost" value={simCost} onChange={(e) => setSimCost(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sim-delta">Custo +%</Label>
                <Input id="sim-delta" value={simCostDelta} onChange={(e) => setSimCostDelta(e.target.value)} />
              </div>
            </div>
            <p className="text-sm">Margem atual: <span className="font-semibold">{simulator.margin.toFixed(1)}%</span></p>
            <p className="text-sm">Custo ajustado: <span className="font-semibold">R$ {simulator.adjustedCost.toFixed(2)}</span></p>
            <p className="text-sm">Margem projetada: <span className="font-semibold">{simulator.adjustedMargin.toFixed(1)}%</span></p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/products/margin-analysis">Abrir análise completa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <CardTitleHelp
                icon={ClipboardList}
                title="Sincronização entre dispositivos"
                help="Confirma se os dados estão alinhados entre os dispositivos da operação."
              />
            </CardTitle>
            <CardDescription>Visão simples para confirmar se os dados estão alinhados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isHistoryLoading && <p className="text-muted-foreground">Carregando histórico...</p>}
            {historyError && <p className="text-destructive">Erro: {historyError}</p>}
            {!isHistoryLoading && !historyError && history.length === 0 && (
              <p className="text-muted-foreground">Sem eventos de auditoria.</p>
            )}
            {!isHistoryLoading && !historyError && history.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border p-2">
                    <p className="text-xs text-muted-foreground">Última verificação</p>
                    <p className="font-medium">
                      {new Date(lastHistory.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-xs text-muted-foreground">Resultado</p>
                    <p className={`font-medium ${lastHistory.is_consistent ? "text-emerald-700" : "text-red-700"}`}>
                      {lastHistory.is_consistent ? "Dados alinhados" : "Diferenças encontradas"}
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-xs text-muted-foreground">Alertas recentes</p>
                    <p className="font-medium">{inconsistentRecent}</p>
                  </div>
                </div>
                <details className="rounded-md border p-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Ver detalhes técnicos
                  </summary>
                  <div className="mt-2 space-y-2">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <p className="font-medium">#{item.id} · {item.machine_id || "N/A"}</p>
                          <p className="text-muted-foreground">
                            {new Date(item.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <Badge variant={item.is_consistent ? "outline" : "destructive"}>
                          {item.is_consistent ? "OK" : `${item.mismatches_count} mismatch`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CardTitleHelp
                icon={ShieldCheck}
                title="Saúde técnica"
                help="Resumo rápido da estabilidade: sync atual, última verificação e erros."
              />
            </CardTitle>
            <CardDescription>Resumo rápido para saber se está estável.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {healthItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border p-2">
                <span>{item.label}</span>
                <span className={item.ok ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>
                  {item.value}
                </span>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              Atualizar diagnóstico
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <CardTitleHelp
              icon={CheckCircle2}
              title="Fechamento do dia"
              help="Mostra o resumo financeiro diário e recomendações para decisão."
            />
          </CardTitle>
          <CardDescription>Resumo financeiro diário com recomendações objetivas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Vendas concluídas</p>
            <p className="text-lg font-semibold">{dailyClose.doneOrders}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-lg font-semibold">R$ {dailyClose.sales.toFixed(2)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Lucro bruto estimado</p>
            <p className="text-lg font-semibold">R$ {dailyClose.grossProfit.toFixed(2)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Caixa líquido</p>
            <p className="text-lg font-semibold">R$ {dailyClose.netCash.toFixed(2)}</p>
          </div>
          <div className="md:col-span-4 rounded-md border p-3">
            <p className="text-sm font-medium mb-2">Recomendações</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {dailyClose.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
