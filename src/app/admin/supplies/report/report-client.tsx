
"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, Timestamp } from 'firebase/firestore';
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

export function SuppliesReportClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "archived" | "all">("all");
  const [typeFilter, setTypeFilter] = useState<'ingredient' | 'packaging' | 'all'>('all');
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const suppliesCollection = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'supplies'));
  }, [firestore, user]);

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

        const matchesType = typeFilter === 'all' || s.type === typeFilter;
        
        const matchesSearch = 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.sku && s.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.supplier && s.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesViewMode && matchesSearch && matchesType;
    });
  }, [supplies, searchTerm, viewMode, typeFilter]);

  const showLoading = isUserLoading || (isLoading && !supplies);
  
  const getDate = (date: any): Date | null => {
      if (!date) return null;
      if (date instanceof Date) return date;
      if (typeof (date as any).toDate === 'function') return (date as any).toDate();
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
            <Select name="report-type-filter" value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger id="report-type-filter" className="w-full">
                    <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="ingredient">Ingredientes</SelectItem>
                    <SelectItem value="packaging">Embalagens</SelectItem>
                </SelectContent>
            </Select>
            <Select name="report-view-mode" value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
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
          <div className="overflow-x-auto">
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
                      return (
                        <TableRow key={supply.id}>
                            <TableCell className="font-medium">{supply.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                                {supply.type === 'packaging' ? <Package className="h-3 w-3"/> : <FlaskConical className="h-3 w-3" />}
                                {supply.type === 'packaging' ? 'Embalagem' : 'Ingrediente'}
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
        )}
      </CardContent>
    </Card>
  );
}
