

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser, useSupabaseStore, useCollection } from "@/supabase/compat";
import { inactivateSupply, reactivateSupply, addSupply, getInventoryMovements } from "@/services";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader, ArrowRight } from "lucide-react";
import type { InventoryMovement, Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { SupplyFormDialog } from "@/components/admin/supplies/supply-form-dialog";
import { SupplyQuickAddDialog } from "@/components/admin/supplies/supply-quick-add-dialog";
import { SupplyImportDialog } from "@/components/admin/supplies/supply-import-dialog";
import { SupplyActions } from "@/components/admin/supplies/supply-actions";
import { SupplyTable } from "@/components/admin/supplies/supply-table";
import { SupplyDetailSheet } from "@/components/admin/supplies/supply-detail-sheet";
import { SupplyAdjustmentDialog } from "@/components/admin/supplies/supply-adjustment-dialog";
import { InventoryMovementsTable } from "@/components/admin/supplies/inventory-movements-table";
import { collection, query } from "@/supabase/compat/SupabaseStore";
import Papa from "papaparse";
import { getTenantCollectionPath } from "@/lib/tenant";
import { useActiveTenant } from "@/hooks/use-active-tenant";

type SortKey = keyof Supply | "";
type SortDirection = "asc" | "desc";

const PACKAGING_KEYWORDS = [
  "embal",
  "caixa",
  "pote",
  "bandeja",
  "tampa",
  "saco",
  "sacola",
  "frasco",
  "garrafa",
  "forma",
  "papel",
  "adesivo",
  "fita",
  "tag",
  "copo",
  "colher",
  "prato",
];

function resolveSupplyType(supply: Supply): "ingredient" | "packaging" {
  if (supply.type === "packaging" || supply.type === "ingredient") {
    return supply.type;
  }

  const haystack = [supply.name, supply.category, supply.sku, supply.purchaseFormat]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return PACKAGING_KEYWORDS.some((keyword) => haystack.includes(keyword)) ? "packaging" : "ingredient";
}

export function InventoryClient() {
  const [detailSupplyId, setDetailSupplyId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [quickAddSupply, setQuickAddSupply] = useState<Supply | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [supplyPendingArchive, setSupplyPendingArchive] = useState<Supply | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const [activeTab, setActiveTab] = useState<"all" | "ingredient" | "packaging">("all");
  const [inventorySection, setInventorySection] = useState<"items" | "movements">("items");
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const { toast } = useToast();

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const SupabaseStore = useSupabaseStore();
  const { user } = useUser();
  const { activeTenantId } = useActiveTenant();

  const suppliesQuery = useMemo(() => {
    if (!SupabaseStore || !activeTenantId) return null;
    return query(collection(SupabaseStore, getTenantCollectionPath(activeTenantId, "supplies")));
  }, [SupabaseStore, activeTenantId]);

  const { data: allSupplies, isLoading } = useCollection<Supply>(suppliesQuery);

  const detailSupply = useMemo(
    () => (detailSupplyId ? allSupplies?.find((s) => s.id === detailSupplyId) ?? null : null),
    [allSupplies, detailSupplyId]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedSupplies = useMemo(() => {
    if (!allSupplies) return [];

    const items = [...allSupplies];

    if (sortKey) {
      items.sort((a, b) => {
        const aValue = a[sortKey as keyof Supply];
        const bValue = b[sortKey as keyof Supply];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [allSupplies, sortKey, sortDirection]);

  const filteredSupplies = useMemo(() => {
    return sortedSupplies.filter((s) => {
      const resolvedType = resolveSupplyType(s);
      const matchesType = activeTab === "all" || resolvedType === activeTab;
      const isItemActive = s.isActive !== false;
      const matchesViewMode = viewMode === "active" ? isItemActive : !isItemActive;
      const nameMatches = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const brandMatches = (s.brand || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesViewMode && (nameMatches || brandMatches);
    });
  }, [sortedSupplies, searchTerm, viewMode, activeTab]);

  useEffect(() => {
    setDetailSupplyId(null);
    setDetailSheetOpen(false);
    setAdjustmentOpen(false);
    setQuickAddOpen(false);
    setQuickAddSupply(null);
  }, [viewMode, searchTerm, activeTab]);

  const supplyNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of allSupplies ?? []) {
      map[s.id] = s.name;
    }
    return map;
  }, [allSupplies]);

  useEffect(() => {
    if (inventorySection !== "movements" || !activeTenantId) return;

    let cancelled = false;
    setMovementsLoading(true);

    getInventoryMovements(null, activeTenantId, { limit: 400 })
      .then((rows) => {
        if (!cancelled) setInventoryMovements(rows);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Não foi possível carregar movimentações",
            description: e.message,
          });
          setInventoryMovements([]);
        }
      })
      .finally(() => {
        if (!cancelled) setMovementsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inventorySection, activeTenantId, toast]);

  const openDetail = (supply: Supply) => {
    setDetailSupplyId(supply.id);
    setDetailSheetOpen(true);
  };

  const closeDetail = (open: boolean) => {
    setDetailSheetOpen(open);
    if (!open) {
      setDetailSupplyId(null);
      setAdjustmentOpen(false);
      setQuickAddOpen(false);
      setQuickAddSupply(null);
    }
  };

  const handleNovaFicha = () => {
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
  };

  const handleSaveSupply = async (
    formData: Omit<Supply, "id" | "createdAt" | "isActive">,
    financialData: { shouldRegister: boolean; paymentMethod: string; description: string; amount: number }
  ) => {
    if (!SupabaseStore || !user) return;

    const defaultType = activeTab === "all" ? "ingredient" : activeTab;
    const dataToSave = { ...formData, type: formData.type || defaultType };

    try {
      await addSupply(
        SupabaseStore,
        dataToSave,
        { ...financialData, userId: user.uid, tenantId: activeTenantId || undefined },
        activeTenantId || undefined
      );
      toast({
        title: "Ficha criada",
        description: "Abra o insumo na lista para registrar entrada e dar saldo.",
      });
      handleCloseFormDialog();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast({ variant: "destructive", title: "Erro ao salvar", description: msg });
      throw e;
    }
  };

  const handleConfirmArchive = useCallback(async () => {
    if (!supplyPendingArchive || !SupabaseStore) return;

    try {
      if (viewMode === "active") {
        await inactivateSupply(SupabaseStore, supplyPendingArchive.id, activeTenantId || undefined);
        toast({ title: "Insumo arquivado" });
      } else {
        await reactivateSupply(SupabaseStore, supplyPendingArchive.id, activeTenantId || undefined);
        toast({ title: "Insumo reativado" });
      }
      setArchiveConfirmOpen(false);
      setSupplyPendingArchive(null);
      closeDetail(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [supplyPendingArchive, SupabaseStore, viewMode, toast, activeTenantId]);

  const onImportSuccess = async () => {
    setIsImportDialogOpen(false);
    toast({ title: "Importação bem-sucedida!", description: "Itens atualizados." });
  };

  const handleExport = () => {
    if (!allSupplies) {
      toast({ variant: "destructive", title: "Sem dados para exportar" });
      return;
    }
    const csv = Papa.unparse(allSupplies);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "doce_caixa_estoque.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportação iniciada" });
  };

  const openEntradaFromDetail = () => {
    if (detailSupply) {
      setQuickAddSupply(detailSupply);
      setQuickAddOpen(true);
    }
  };

  const openAjusteFromDetail = () => {
    setAdjustmentOpen(true);
  };

  const requestArchiveFromDetail = () => {
    if (detailSupply) {
      setSupplyPendingArchive(detailSupply);
      setArchiveConfirmOpen(true);
    }
  };

  return (
    <>
      <Card className="w-full flex-1 flex flex-col h-full min-h-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Insumos</CardTitle>
              <CardDescription>
                Toque em um item para ver saldo, histórico e <strong>Registrar entrada</strong>.{" "}
                <strong>Nova ficha</strong> só cadastra (sem estoque).
              </CardDescription>
            </div>
            <SupplyActions
              onAdd={handleNovaFicha}
              onImport={() => setIsImportDialogOpen(true)}
              onExport={handleExport}
            />
          </div>
          <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "ingredient" | "packaging")} className="w-full sm:w-auto">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="ingredient">Ingredientes</TabsTrigger>
                <TabsTrigger value="packaging">Embalagens</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1 flex w-full sm:justify-end gap-2 flex-col sm:flex-row">
              <div className="relative w-full sm:w-auto sm:min-w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inventory-search"
                  name="inventory-search"
                  placeholder="Buscar nome ou marca..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={viewMode} onValueChange={(value: "active" | "archived") => setViewMode(value)}>
                <SelectTrigger id="inventory-view-mode" name="inventory-view-mode" className="w-full sm:w-[190px]">
                  <SelectValue placeholder="Ver status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="archived">Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <Tabs
            value={inventorySection}
            onValueChange={(v) => setInventorySection(v as "items" | "movements")}
            className="flex flex-col flex-1 min-h-0 gap-4"
          >
            <TabsList className="w-full sm:w-auto shrink-0">
              <TabsTrigger value="items">Lista</TabsTrigger>
              <TabsTrigger value="movements">Todas as movimentações</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
              <Alert className="mb-4 shrink-0 py-3">
                <AlertDescription className="text-sm">
                  Cadastro: nome, marca, unidade, categoria, mínimo — <strong>sem saldo</strong>. Operação: abrir o insumo →
                  entrada (compra) ou ajuste (correção).
                </AlertDescription>
              </Alert>
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <SupplyTable
                  supplies={filteredSupplies}
                  activeDetailSupplyId={detailSheetOpen ? detailSupplyId : null}
                  onRowClick={openDetail}
                  onSort={handleSort}
                  sortKey={sortKey}
                />
              )}
            </TabsContent>
            <TabsContent value="movements" className="flex flex-col flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
              <p className="text-sm text-muted-foreground mb-3">
                Histórico geral do tenant. No detalhe de cada insumo há a aba <strong>Movimentações</strong> filtrada.
              </p>
              <InventoryMovementsTable
                movements={inventoryMovements}
                supplyNames={supplyNameById}
                isLoading={movementsLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-start w-full border-t pt-4">
          <Button variant="outline" asChild>
            <Link href="/admin/supplies/report">
              Ver relatório
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <SupplyDetailSheet
        supply={detailSupply}
        open={detailSheetOpen && !!detailSupply}
        onOpenChange={closeDetail}
        tenantId={activeTenantId || undefined}
        viewMode={viewMode}
        onRegistrarEntrada={openEntradaFromDetail}
        onAjuste={openAjusteFromDetail}
        onArchiveOrReactivate={requestArchiveFromDetail}
      />

      <SupplyFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSave={handleSaveSupply}
        defaultType={activeTab === "all" ? "ingredient" : activeTab}
      />

      {quickAddSupply && (
        <SupplyQuickAddDialog
          isOpen={quickAddOpen}
          onClose={() => {
            setQuickAddOpen(false);
            setQuickAddSupply(null);
          }}
          supply={quickAddSupply}
          onSuccess={() => {
            setQuickAddOpen(false);
            setQuickAddSupply(null);
          }}
        />
      )}

      <SupplyAdjustmentDialog
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        supply={detailSupply}
        tenantId={activeTenantId || undefined}
        onSuccess={() => {}}
      />

      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar</AlertDialogTitle>
            <AlertDialogDescription>
              {viewMode === "active"
                ? `Arquivar "${supplyPendingArchive?.name}"? Ele some das listas de uso.`
                : `Reativar "${supplyPendingArchive?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplyPendingArchive(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SupplyImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSuccess={onImportSuccess}
        defaultType={activeTab === "all" ? "ingredient" : activeTab}
      />
    </>
  );
}
