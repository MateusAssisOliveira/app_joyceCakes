"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  FlaskConical,
  Package,
} from "lucide-react";
import type { Supply } from "@/types";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

type SortKey = keyof Supply | "";

type SupplyTableProps = {
  supplies: Supply[];
  /** Insumo com painel de detalhe aberto (destaque na lista). */
  activeDetailSupplyId?: string | null;
  onRowClick: (supply: Supply) => void;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
};

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

export function SupplyTable({
  supplies,
  activeDetailSupplyId,
  onRowClick,
  onSort,
  sortKey,
}: SupplyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const toSafeNumber = (value: unknown, fallback = 0) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

  const formatNumber = (value: unknown, min = 0, max = 3) =>
    toSafeNumber(value).toLocaleString("pt-BR", {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    });

  const getFriendlyQuantity = (value: unknown, unit: Supply["unit"]) => {
    const normalizedValue = toSafeNumber(value);
    if (unit === "g" && normalizedValue >= 1000) return `${formatNumber(normalizedValue / 1000)} kg`;
    if (unit === "ml" && normalizedValue >= 1000) return `${formatNumber(normalizedValue / 1000)} L`;
    return `${formatNumber(normalizedValue)} ${unit}`;
  };

  const getResolvedType = (supply: Supply): "ingredient" | "packaging" => {
    if (supply.type === "packaging" || supply.type === "ingredient") {
      return supply.type;
    }

    const haystack = [supply.name, supply.category, supply.sku, supply.purchaseFormat]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return PACKAGING_KEYWORDS.some((keyword) => haystack.includes(keyword)) ? "packaging" : "ingredient";
  };

  const totalPages = Math.ceil(supplies.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [supplies, currentPage, totalPages]);

  const paginatedSupplies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return supplies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [supplies, currentPage]);

  const SortableHeader = ({ tKey, label }: { tKey: SortKey; label: string }) => {
    const isSorted = sortKey === tKey;
    return (
      <Button variant="ghost" onClick={() => onSort(tKey)} className="px-2 py-1 h-auto -ml-2">
        {label}
        <ArrowUpDown
          className={cn("ml-2 h-4 w-4", isSorted ? "text-primary" : "text-muted-foreground/50")}
        />
      </Button>
    );
  };

  return (
    <div className="flex-1 overflow-auto min-h-0 flex flex-col">
      <div className="space-y-3 md:hidden">
        {paginatedSupplies.map((supply) => {
          const resolvedType = getResolvedType(supply);
          return (
            <button
              key={supply.id}
              type="button"
              onClick={() => onRowClick(supply)}
              className={cn(
                "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors",
                activeDetailSupplyId === supply.id && "ring-2 ring-primary bg-accent/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{supply.name}</p>
                  {supply.brand ? (
                    <p className="text-xs text-muted-foreground">{supply.brand}</p>
                  ) : null}
                </div>
                <Badge variant="outline" className="shrink-0 font-normal">
                  {resolvedType === "packaging" ? <Package className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saldo</span>
                <Badge
                  variant={supply.minStock != null && supply.stock < supply.minStock ? "destructive" : "secondary"}
                >
                  {getFriendlyQuantity(supply.stock, supply.unit)}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Toque para detalhes e registrar entrada</p>
            </button>
          );
        })}
        {supplies.length === 0 && (
          <div className="h-24 rounded-lg border text-center text-sm text-muted-foreground flex items-center justify-center">
            Nenhum insumo encontrado.
          </div>
        )}
      </div>

      <div className="relative hidden md:block flex-1 w-full overflow-auto">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader tKey="name" label="Insumo" />
              </TableHead>
              <TableHead>
                <SortableHeader tKey="stock" label="Saldo" />
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSupplies.map((supply) => {
              const resolvedType = getResolvedType(supply);
              return (
                <TableRow
                  key={supply.id}
                  data-state={activeDetailSupplyId === supply.id ? "selected" : ""}
                  onClick={() => onRowClick(supply)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{supply.name}</div>
                    {supply.brand ? (
                      <div className="text-xs text-muted-foreground">{supply.brand}</div>
                    ) : null}
                    {supply.category ? (
                      <div className="text-xs text-muted-foreground">{supply.category}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={supply.minStock != null && supply.stock < supply.minStock ? "destructive" : "secondary"}
                    >
                      {getFriendlyQuantity(supply.stock, supply.unit)}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={supply.isActive !== false ? "default" : "outline"}
                      className={cn(supply.isActive !== false && "bg-emerald-600 hover:bg-emerald-600")}
                    >
                      {supply.isActive !== false ? "Ativo" : "Arquivado"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {supplies.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Nenhum insumo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full pt-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground text-center sm:text-left">
          {supplies.length} item(ns)
        </div>
        <div className="flex items-center justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-8 sm:w-8"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || totalPages === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-8 sm:w-8"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || totalPages === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Página {totalPages > 0 ? currentPage : 0} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-8 sm:w-8"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-8 sm:w-8"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
