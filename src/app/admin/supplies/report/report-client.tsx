
"use client";

import { useState, useMemo } from "react";
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Loader, FlaskConical, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Supply } from "@/types";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { getTenantCollectionPath } from "@/lib/tenant";
import { useActiveTenant } from "@/hooks/use-active-tenant";

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

  const haystack = [
    supply.name,
    supply.category,
    supply.sku,
    supply.purchaseFormat,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return PACKAGING_KEYWORDS.some((keyword) => haystack.includes(keyword))
    ? "packaging"
    : "ingredient";
}

export function SuppliesReportClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "archived" | "all">("all");
  const [typeFilter, setTypeFilter] = useState<'ingredient' | 'packaging' | 'all'>('all');
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { activeTenantId } = useActiveTenant();
  
  const suppliesCollection = useMemo(() => {
    if (!firestore || !activeTenantId) return null;
    return query(collection(firestore, getTenantCollectionPath(activeTenantId, "supplies")));
  }, [firestore, activeTenantId]);

  const { data: supplies, isLoading } = useCollection<Supply>(suppliesCollection);

  const filteredSupplies = useMemo(() => {
    if (!supplies) return [];
    return supplies.filter(s => {
        const isItemActive = s.isActive !== false;
        let matchesViewMode = true;
        if (viewMode === 'active') {
            matchesViewMode = isItemActive;
        } else if (viewMode === 'archived') {
            matchesViewMode = !isItemActive;
        }

        const resolvedType = resolveSupplyType(s);
        const matchesType = typeFilter === 'all' || resolvedType === typeFilter;
        
        const matchesSearch = 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.sku && s.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.supplier && s.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesViewMode && matchesSearch && matchesType;
    });
  }, [supplies, searchTerm, viewMode, typeFilter]);

  const showLoading = isUserLoading || (isLoading && !supplies);
  
  const getDate = (date: unknown): Date | null => {
      if (!date) return null;
      if (date instanceof Date) return date;
      if (typeof date === "object" && date !== null && "toDate" in date) {
        return (date as { toDate: () => Date }).toDate();
      }
      return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Relatório Geral de Estoque</CardTitle>
                <CardDescription>Filtre e analise os dados detalhados de ingredientes e embalagens.</CardDescription>
            </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative w-full sm:col-span-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    id="report-search"
                    name="report-search"
                    placeholder="Buscar por nome, SKU ou fornecedor..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select name="report-type-filter" value={typeFilter} onValueChange={(value) => setTypeFilter(value as "ingredient" | "packaging" | "all")}>
                <SelectTrigger id="report-type-filter" className="w-full">
                    <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="ingredient">Ingredientes</SelectItem>
                    <SelectItem value="packaging">Embalagens</SelectItem>
                </SelectContent>
            </Select>
            <Select name="report-view-mode" value={viewMode} onValueChange={(value) => setViewMode(value as "active" | "archived" | "all")}>
                <SelectTrigger id="report-view-mode" className="w-full">
                    <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ver Ativos</SelectItem>
                    <SelectItem value="archived">Ver Arquivados</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        {showLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <div className="space-y-3 md:hidden">
              {filteredSupplies.map((supply) => {
                const purchaseDate = getDate(supply.lastPurchaseDate);
                const resolvedType = resolveSupplyType(supply);
                return (
                  <div key={supply.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{supply.name}</p>
                      <Badge variant={supply.isActive !== false ? "default" : "outline"} className={cn("text-xs", supply.isActive !== false && "bg-emerald-500 hover:bg-emerald-600")}>
                        {supply.isActive !== false ? "Ativo" : "Arquivado"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                        {resolvedType === 'packaging' ? <Package className="h-3 w-3"/> : <FlaskConical className="h-3 w-3" />}
                        {resolvedType === 'packaging' ? 'Embalagem' : 'Ingrediente'}
                      </Badge>
                      <Badge variant={supply.minStock != null && supply.stock < supply.minStock ? "destructive" : "secondary"}>
                        {supply.stock} {supply.unit}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Custo/Un.</span>
                        <span>{supply.costPerUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fornecedor</span>
                        <span>{supply.supplier || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Última compra</span>
                        <span>{purchaseDate ? format(purchaseDate, "dd/MM/yy") : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredSupplies.length === 0 && (
                <div className="h-24 rounded-lg border text-center text-sm text-muted-foreground flex items-center justify-center">
                  Nenhum item encontrado para os filtros aplicados.
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Custo/Un.</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Última Compra</TableHead>
                          <TableHead>Status</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredSupplies && filteredSupplies.map((supply) => {
                        const purchaseDate = getDate(supply.lastPurchaseDate);
                        const resolvedType = resolveSupplyType(supply);
                        return (
                          <TableRow key={supply.id}>
                              <TableCell className="font-medium">{supply.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                                  {resolvedType === 'packaging' ? <Package className="h-3 w-3"/> : <FlaskConical className="h-3 w-3" />}
                                  {resolvedType === 'packaging' ? 'Embalagem' : 'Ingrediente'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={supply.minStock != null && supply.stock < supply.minStock ? "destructive" : "secondary"}>
                                    {supply.stock} {supply.unit}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {supply.costPerUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </TableCell>
                               <TableCell>{supply.supplier || 'N/A'}</TableCell>
                               <TableCell>
                                  {purchaseDate ? format(purchaseDate, "dd/MM/yy") : 'N/A'}
                              </TableCell>
                               <TableCell>
                                <Badge variant={supply.isActive !== false ? "default" : "outline"} className={cn("text-xs", supply.isActive !== false && "bg-emerald-500 hover:bg-emerald-600")}>
                                  {supply.isActive !== false ? "Ativo" : "Arquivado"}
                                </Badge>
                              </TableCell>
                          </TableRow>
                        )
                      })}
                      {filteredSupplies.length === 0 && <TableRow><TableCell colSpan={8} className="text-center h-24">Nenhum item encontrado para os filtros aplicados.</TableCell></TableRow>}
                  </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
