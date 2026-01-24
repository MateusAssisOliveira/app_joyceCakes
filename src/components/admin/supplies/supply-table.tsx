

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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, FlaskConical, Package } from "lucide-react";
import type { Supply } from "@/types";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

type SortKey = keyof Supply | '';

type SupplyTableProps = {
  supplies: Supply[];
  selectedSupplyId: string | null;
  onRowClick: (supply: Supply) => void;
  onRowDoubleClick: (supply: Supply) => void;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
  sortDirection: 'asc' | 'desc';
};

export function SupplyTable({
  supplies,
  selectedSupplyId,
  onRowClick,
  onRowDoubleClick,
  onSort,
  sortKey,
  sortDirection
}: SupplyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

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
  
  const SortableHeader = ({ tKey, label }: { tKey: SortKey, label: string }) => {
    const isSorted = sortKey === tKey;
    return (
        <Button variant="ghost" onClick={() => onSort(tKey)} className="px-2 py-1 h-auto -ml-2">
            {label}
            <ArrowUpDown className={cn("ml-2 h-4 w-4", isSorted ? "text-primary" : "text-muted-foreground/50")} />
        </Button>
    )
  }

  return (
    <div className="flex-1 overflow-auto min-h-0 flex flex-col">
        <div className="relative flex-1 w-full overflow-auto">
            <Table className="w-full table-auto">
                <TableHeader>
                    <TableRow>
                    <TableHead><SortableHeader tKey="name" label="Nome" /></TableHead>
                    <TableHead><SortableHeader tKey="stock" label="Estoque" /></TableHead>
                    <TableHead><SortableHeader tKey="costPerUnit" label="Preço de Compra" /></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedSupplies && paginatedSupplies.map((supply) => (
                    <TableRow 
                        key={supply.id} 
                        data-state={selectedSupplyId === supply.id ? 'selected' : ''}
                        onClick={() => onRowClick(supply)}
                        onDoubleClick={() => onRowDoubleClick(supply)}
                        className="cursor-pointer"
                    >
                        <TableCell className="font-medium">{supply.name}</TableCell>
                        <TableCell>
                            <Badge variant={supply.minStock != null && supply.stock < supply.minStock ? "destructive" : "secondary"}>
                                {supply.stock} {supply.unit}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {supply.costPerUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / {supply.unit}
                        </TableCell>
                        <TableCell>
                            <Badge variant={supply.isActive !== false ? "default" : "outline"} className={cn(supply.isActive !== false && "bg-emerald-500 hover:bg-emerald-600")}>
                            {supply.isActive !== false ? "Ativo" : "Arquivado"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                                {supply.type === 'packaging' ? <Package className="h-3 w-3"/> : <FlaskConical className="h-3 w-3" />}
                                {supply.type === 'packaging' ? 'Embalagem' : 'Ingrediente'}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                    {supplies.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum insumo encontrado.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end w-full space-x-2 pt-4 border-t">
            <div className="flex-1 text-sm text-muted-foreground">
                {supplies.length} de {supplies.length} item(s).
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || totalPages === 0}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || totalPages === 0}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm font-medium">Página {totalPages > 0 ? currentPage : 0} de {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
        </div>
    </div>
  );
}
