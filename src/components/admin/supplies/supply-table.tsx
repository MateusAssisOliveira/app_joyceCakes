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
  Pencil,
} from "lucide-react";
import type { Supply } from "@/types";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

type SortKey = keyof Supply | "";

type SupplyTableProps = {
  supplies: Supply[];
  selectedSupplyId: string | null;
  onRowClick: (supply: Supply) => void;
  onRowDoubleClick: (supply: Supply) => void;
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
  selectedSupplyId,
  onRowClick,
  onRowDoubleClick,
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

  const formatCurrency = (value: unknown, min = 2, max = 2) =>
    toSafeNumber(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    });

  const getFriendlyQuantity = (value: unknown, unit: Supply["unit"]) => {
    const normalizedValue = toSafeNumber(value);
    if (unit === "g" && normalizedValue >= 1000) return `${formatNumber(normalizedValue / 1000)} kg`;
    if (unit === "ml" && normalizedValue >= 1000) return `${formatNumber(normalizedValue / 1000)} L`;
    return `${formatNumber(normalizedValue)} ${unit}`;
  };

  const getPresentationLabel = (supply: Supply) => {
    const packageQuantity = toSafeNumber(supply.packageQuantity);
    if (!packageQuantity || packageQuantity <= 0) return "Sem apresentacao";
    const formatLabel = (supply.purchaseFormat || "pacote").toLowerCase();
    return `${formatLabel} de ${getFriendlyQuantity(packageQuantity, supply.unit)}`;
  };

  const getUnitPurchasePriceLabel = (supply: Supply) => {
    const packageQuantity = toSafeNumber(supply.packageQuantity);
    const packageCost = toSafeNumber(supply.packageCost);
    const costPerUnit = toSafeNumber(supply.costPerUnit);

    if (packageQuantity > 0) {
      const purchaseFormat = (supply.purchaseFormat || "pacote").toLowerCase();
      const packagePrice = packageCost > 0 ? packageCost : costPerUnit * packageQuantity;
      return `${formatCurrency(packagePrice)} / ${purchaseFormat}`;
    }
    return `${formatCurrency(costPerUnit)} / ${supply.unit}`;
  };

  const getResolvedType = (supply: Supply): "ingredient" | "packaging" => {
    if (supply.type === "packaging" || supply.type === "ingredient") {
      return supply.type;
    }

    const haystack = [supply.name, supply.category, supply.sku, supply.purchaseFormat]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return PACKAGING_KEYWORDS.some((keyword) => haystack.includes(keyword))
      ? "packaging"
      : "ingredient";
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
        {paginatedSupplies.map((supply) => (
          (() => {
            const resolvedType = getResolvedType(supply);
            return (
          <div
            key={supply.id}
            onClick={() => onRowClick(supply)}
            className={cn(
              "cursor-pointer rounded-lg border p-3",
              selectedSupplyId === supply.id && "ring-2 ring-primary bg-accent/40"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{supply.name}</p>
              <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                {resolvedType === "packaging" ? (
                  <Package className="h-3 w-3" />
                ) : (
                  <FlaskConical className="h-3 w-3" />
                )}
                {resolvedType === "packaging" ? "Embalagem" : "Ingrediente"}
              </Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Apresentacao</span>
              <span className="font-medium capitalize">{getPresentationLabel(supply)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estoque</span>
              <Badge
                variant={supply.minStock != null && supply.stock < supply.minStock ? "destructive" : "secondary"}
              >
                {getFriendlyQuantity(supply.stock, supply.unit)}
              </Badge>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Preco unitario</span>
              <span className="font-medium">
                {getUnitPurchasePriceLabel(supply)}
              </span>
            </div>
            <div className="mt-2">
              <Badge
                variant={supply.isActive !== false ? "default" : "outline"}
                className={cn(supply.isActive !== false && "bg-emerald-500 hover:bg-emerald-600")}
              >
                {supply.isActive !== false ? "Ativo" : "Arquivado"}
              </Badge>
            </div>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full tap-target"
                onClick={(e) => {
                  e.stopPropagation();
                  onRowDoubleClick(supply);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar estoque
              </Button>
            </div>
          </div>
            );
          })()
        ))}
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
                <SortableHeader tKey="name" label="Nome" />
              </TableHead>
              <TableHead>
                Apresentacao
              </TableHead>
              <TableHead>
                <SortableHeader tKey="stock" label="Estoque" />
              </TableHead>
              <TableHead>
                <SortableHeader tKey="costPerUnit" label="Preco Unitario" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSupplies &&
              paginatedSupplies.map((supply) => (
                (() => {
                  const resolvedType = getResolvedType(supply);
                  return (
                <TableRow
                  key={supply.id}
                  data-state={selectedSupplyId === supply.id ? "selected" : ""}
                  onClick={() => onRowClick(supply)}
                  onDoubleClick={() => onRowDoubleClick(supply)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{supply.name}</TableCell>
                  <TableCell>
                    <span className="capitalize">{getPresentationLabel(supply)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={supply.minStock != null && supply.stock < supply.minStock ? "destructive" : "secondary"}
                    >
                      {getFriendlyQuantity(supply.stock, supply.unit)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span>{getUnitPurchasePriceLabel(supply)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={supply.isActive !== false ? "default" : "outline"}
                      className={cn(supply.isActive !== false && "bg-emerald-500 hover:bg-emerald-600")}
                    >
                      {supply.isActive !== false ? "Ativo" : "Arquivado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                      {resolvedType === "packaging" ? (
                        <Package className="h-3 w-3" />
                      ) : (
                        <FlaskConical className="h-3 w-3" />
                      )}
                      {resolvedType === "packaging" ? "Embalagem" : "Ingrediente"}
                    </Badge>
                  </TableCell>
                </TableRow>
                  );
                })()
              ))}
            {supplies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Nenhum insumo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full pt-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground text-center sm:text-left">
          {supplies.length} de {supplies.length} item(s).
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
            Pagina {totalPages > 0 ? currentPage : 0} de {totalPages}
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
