"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, Package, FlaskConical, Archive, ArchiveRestore } from "lucide-react";
import type { InventoryMovement, Supply } from "@/types";
import { getInventoryMovements, updateSupply } from "@/services";
import { InventoryMovementsTable } from "@/components/admin/supplies/inventory-movements-table";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseStore } from "@/supabase/compat";
import { splitSupplyStockForUX } from "@/lib/supply-stock-ux";
import { cn } from "@/lib/utils";

function formatSaldo(stock: number, unit: Supply["unit"]): string {
  const n = Number(stock) || 0;
  if (unit === "g" && n >= 1000) {
    return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg · ${n.toLocaleString("pt-BR")} g`;
  }
  if (unit === "ml" && n >= 1000) {
    return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} L · ${n.toLocaleString("pt-BR")} ml`;
  }
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
}

const parseHumanQty = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return 0;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

type SupplyDetailSheetProps = {
  supply: Supply | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | undefined;
  viewMode: "active" | "archived";
  onRegistrarEntrada: () => void;
  onAjuste: () => void;
  onArchiveOrReactivate: () => void;
  onFichaSaved?: () => void;
};

function EditFichaTab({
  supply,
  tenantId,
  onSaved,
}: {
  supply: Supply;
  tenantId: string | undefined;
  onSaved: () => void;
}) {
  const [name, setName] = useState(supply.name);
  const [brand, setBrand] = useState(supply.brand ?? "");
  const [category, setCategory] = useState(supply.category ?? "");
  const [type, setType] = useState<"ingredient" | "packaging">(
    supply.type === "packaging" ? "packaging" : "ingredient"
  );
  const [minStr, setMinStr] = useState(() => {
    const s = splitSupplyStockForUX(supply);
    return s.minStockPurchaseQty > 0 ? String(s.minStockPurchaseQty) : "";
  });
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const SupabaseStore = useSupabaseStore();

  useEffect(() => {
    const s = splitSupplyStockForUX(supply);
    setName(supply.name);
    setBrand(supply.brand ?? "");
    setCategory(supply.category ?? "");
    setType(supply.type === "packaging" ? "packaging" : "ingredient");
    setMinStr(s.minStockPurchaseQty > 0 ? String(s.minStockPurchaseQty) : "");
  }, [supply]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório" });
      return;
    }
    if (!tenantId || !SupabaseStore) return;
    const minStock = Math.max(0, Math.round(parseHumanQty(minStr)));
    setBusy(true);
    try {
      await updateSupply(
        SupabaseStore,
        supply.id,
        {
          name: name.trim(),
          brand: brand.trim() || "",
          category: category.trim() || "Geral",
          type,
          minStock,
        },
        undefined,
        tenantId
      );
      toast({ title: "Ficha atualizada" });
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast({ variant: "destructive", title: "Erro", description: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-xs text-muted-foreground">
        Unidade base <strong>{supply.unit}</strong> e custo atual <strong>R$ {supply.costPerUnit?.toFixed(4) ?? "0"}</strong>{" "}
        por {supply.unit} — custo de compra é atualizado em <strong>Registrar entrada</strong>.
      </p>
      <div className="grid gap-2">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
      </div>
      <div className="grid gap-2">
        <Label>Marca</Label>
        <Input value={brand} onChange={(e) => setBrand(e.target.value)} disabled={busy} placeholder="Opcional" />
      </div>
      <div className="grid gap-2">
        <Label>Categoria</Label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy} />
      </div>
      <div className="grid gap-2">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v: "ingredient" | "packaging") => setType(v)} disabled={busy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ingredient">Ingrediente</SelectItem>
            <SelectItem value="packaging">Embalagem</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Estoque mínimo ({supply.unit})</Label>
        <Input inputMode="numeric" value={minStr} onChange={(e) => setMinStr(e.target.value)} disabled={busy} />
      </div>
      <Button className="w-full" onClick={handleSave} disabled={busy}>
        {busy && <Loader className="mr-2 h-4 w-4 animate-spin" />}
        Salvar alterações
      </Button>
    </div>
  );
}

export function SupplyDetailSheet({
  supply,
  open,
  onOpenChange,
  tenantId,
  viewMode,
  onRegistrarEntrada,
  onAjuste,
  onArchiveOrReactivate,
  onFichaSaved,
}: SupplyDetailSheetProps) {
  const [tab, setTab] = useState("resumo");
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movLoading, setMovLoading] = useState(false);
  const [sheetSide, setSheetSide] = useState<"bottom" | "right">("bottom");

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const apply = () => setSheetSide(mql.matches ? "right" : "bottom");
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (open) setTab("resumo");
  }, [open, supply?.id]);

  useEffect(() => {
    if (!open || !supply || !tenantId || tab !== "mov") return;
    let cancelled = false;
    setMovLoading(true);
    getInventoryMovements(null, tenantId, { supplyId: supply.id, limit: 250 })
      .then((rows) => {
        if (!cancelled) setMovements(rows);
      })
      .catch(() => {
        if (!cancelled) setMovements([]);
      })
      .finally(() => {
        if (!cancelled) setMovLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, supply?.id, tenantId, tab]);

  const supplyNames = useMemo(() => (supply ? { [supply.id]: supply.name } : {}), [supply]);

  if (!supply) return null;

  const resolvedType =
    supply.type === "packaging" || supply.type === "ingredient" ? supply.type : "ingredient";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
        className={cn(
          "flex w-full flex-col gap-0 p-0 sm:max-w-lg",
          sheetSide === "bottom" ? "h-[92vh] max-h-[92vh]" : "h-full"
        )}
      >
        <div className="shrink-0 border-b px-4 pb-3 pt-4">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="pr-8 text-xl leading-tight">{supply.name}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2">
              {supply.brand ? <span>Marca: {supply.brand}</span> : <span className="text-muted-foreground">Sem marca</span>}
              <span className="text-muted-foreground">·</span>
              <Badge variant="outline" className="font-normal">
                {resolvedType === "packaging" ? (
                  <>
                    <Package className="mr-1 h-3 w-3" /> Embalagem
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-1 h-3 w-3" /> Ingrediente
                  </>
                )}
              </Badge>
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col overflow-hidden pt-2">
            <TabsList className="grid w-full shrink-0 grid-cols-3">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="mov">Movimentações</TabsTrigger>
              <TabsTrigger value="edit">Editar</TabsTrigger>
            </TabsList>
            <TabsContent value="resumo" className="mt-3 flex-1 overflow-y-auto data-[state=inactive]:hidden">
              <div className="space-y-4 pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo atual</p>
                  <p className="text-2xl font-semibold tracking-tight">{formatSaldo(supply.stock, supply.unit)}</p>
                  {supply.minStock > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mínimo: {formatSaldo(supply.minStock, supply.unit)}
                    </p>
                  )}
                </div>
                <div className="grid gap-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Categoria:</span> {supply.category || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Custo ref. ({supply.unit}):</span>{" "}
                    {Number(supply.costPerUnit || 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 4,
                    })}
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={onArchiveOrReactivate}>
                  {viewMode === "active" ? (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar insumo
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Reativar insumo
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="mov" className="mt-3 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
              <InventoryMovementsTable movements={movements} supplyNames={supplyNames} isLoading={movLoading} />
            </TabsContent>
            <TabsContent value="edit" className="mt-3 flex-1 overflow-y-auto data-[state=inactive]:hidden">
              <EditFichaTab supply={supply} tenantId={tenantId} onSaved={() => onFichaSaved?.()} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="shrink-0 border-t bg-background p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="flex-1 tap-target" onClick={onRegistrarEntrada}>
              Registrar entrada
            </Button>
            <Button type="button" variant="secondary" className="flex-1 tap-target" onClick={onAjuste}>
              Ajuste
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
