

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser, useFirestore, useCollection } from '@/firebase';
import { inactivateSupply, reactivateSupply, addSupply, updateSupply } from "@/services";
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
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SupplyFormDialog } from "@/components/admin/supplies/supply-form-dialog";
import { SupplyImportDialog } from "@/components/admin/supplies/supply-import-dialog";
import { SupplyActions } from "@/components/admin/supplies/supply-actions";
import { SupplyTable } from "@/components/admin/supplies/supply-table";
import { collection, query } from 'firebase/firestore';
import Papa from "papaparse";


type SortKey = keyof Supply | '';
type SortDirection = 'asc' | 'desc';

export function InventoryClient() {
  const [selectedSupplyId, setSelectedSupplyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [supplyToEdit, setSupplyToEdit] = useState<Supply | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const [activeTab, setActiveTab] = useState<'all' | 'ingredient' | 'packaging'>('all');
  const { toast } = useToast();

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const firestore = useFirestore();
  const { user } = useUser();
  
  const suppliesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'supplies'));
  }, [firestore, user]);

  const { data: allSupplies, isLoading, error } = useCollection<Supply>(suppliesQuery);
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('asc');
    }
  }

  const sortedSupplies = useMemo(() => {
    if (!allSupplies) return [];
    
    const items = [...allSupplies];

    if (sortKey) {
        items.sort((a, b) => {
            const aValue = a[sortKey as keyof Supply];
            const bValue = b[sortKey as keyof Supply];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return items;
  }, [allSupplies, sortKey, sortDirection]);

  const filteredSupplies = useMemo(() => {
    return sortedSupplies.filter(s => {
        const matchesType = activeTab === 'all' || s.type === activeTab;
        const isItemActive = s.isActive !== false;
        const matchesViewMode = viewMode === 'active' ? isItemActive : !isItemActive;
        const nameMatches = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesType && matchesViewMode && nameMatches;
    });
  }, [sortedSupplies, searchTerm, viewMode, activeTab]);
  
  const selectedSupply = useMemo(() => {
      return allSupplies?.find(s => s.id === selectedSupplyId) || null;
  }, [allSupplies, selectedSupplyId]);

  useEffect(() => {
    setSelectedSupplyId(null);
  }, [viewMode, searchTerm, activeTab]);
  
  const handleOpenFormDialog = (supply: Supply | null) => {
    setSupplyToEdit(supply);
    setIsFormDialogOpen(true);
  }

  const handleCloseFormDialog = () => {
    setSupplyToEdit(null);
    setIsFormDialogOpen(false);
  }
  
  const handleSaveSupply = async (
    formData: Omit<Supply, 'id' | 'createdAt' | 'isActive'>,
    financialData: { shouldRegister: boolean; paymentMethod: string; description: string, amount: number; }
    ) => {
    if (!firestore || !user) return;
    
    const defaultType = activeTab === 'all' ? 'ingredient' : activeTab;
    const dataToSave = { ...formData, type: formData.type || defaultType };
    
    try {
        if (supplyToEdit) {
            await updateSupply(firestore, supplyToEdit.id, dataToSave, { ...financialData, userId: user.uid });
            toast({ title: "Item Atualizado!" });
        } else {
            await addSupply(firestore, dataToSave, { ...financialData, userId: user.uid });
            toast({ title: "Item Adicionado!" });
        }
        handleCloseFormDialog();
    } catch(e: any) {
        toast({ variant: "destructive", title: "Erro ao salvar", description: e.message });
        throw e;
    }
  };
  
  const handleConfirmAction = useCallback(async () => {
    if (!selectedSupply || !firestore) return;
    
    const actionPromise = viewMode === 'active' 
      ? inactivateSupply(firestore, selectedSupply.id)
      : reactivateSupply(firestore, selectedSupply.id);
      
    try {
        await actionPromise;
        toast({ title: viewMode === 'active' ? "Item Arquivado" : "Item Reativado" });
        setSelectedSupplyId(null);
        setIsConfirmDialogOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  }, [selectedSupply, firestore, viewMode, toast]);
  
  const onImportSuccess = async () => {
    setIsImportDialogOpen(false);
    toast({ title: "Importação bem-sucedida!", description: "Seus itens foram adicionados ao estoque." });
  };

  const handleExport = () => {
    if (!allSupplies) {
        toast({ variant: "destructive", title: "Sem dados para exportar" });
        return;
    }
    const csv = Papa.unparse(allSupplies);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "doce_caixa_estoque.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportação Iniciada", description: "Seu arquivo de estoque está sendo baixado." });
  }

  const handleRowClick = (supply: Supply) => setSelectedSupplyId(supply.id);
  const handleRowDoubleClick = (supply: Supply) => handleOpenFormDialog(supply);

  return (
    <>
      <Card className="w-full flex-1 flex flex-col h-full min-h-0">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle>Gestão de Itens de Estoque</CardTitle>
                    <CardDescription>Gerencie ingredientes, embalagens e todos os seus insumos em um só lugar.</CardDescription>
                </div>
                 <SupplyActions
                    onAdd={() => handleOpenFormDialog(null)}
                    onImport={() => setIsImportDialogOpen(true)}
                    onExport={handleExport}
                    onEdit={() => selectedSupply && handleOpenFormDialog(selectedSupply)}
                    onArchive={() => setIsConfirmDialogOpen(true)}
                    isEditDisabled={!selectedSupply}
                    isArchiveActionDisabled={!selectedSupply}
                    archiveButtonLabel={viewMode === 'active' ? 'Arquivar' : 'Reativar'}
                 />
            </div>
            <div className="mt-4 flex flex-col-reverse sm:flex-row items-center gap-2">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList>
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        <TabsTrigger value="ingredient">Ingredientes</TabsTrigger>
                        <TabsTrigger value="packaging">Embalagens</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex-1 flex w-full sm:justify-end gap-2">
                     <div className="relative w-full sm:w-auto sm:min-w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="inventory-search"
                            name="inventory-search"
                            placeholder="Buscar item..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={viewMode} onValueChange={(value: "active" | "archived") => setViewMode(value)}>
                        <SelectTrigger id="inventory-view-mode" name="inventory-view-mode" className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Ver status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Ver Ativos</SelectItem>
                            <SelectItem value="archived">Ver Arquivados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <SupplyTable
                supplies={filteredSupplies}
                selectedSupplyId={selectedSupplyId}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onSort={handleSort}
                sortKey={sortKey}
                sortDirection={sortDirection}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-start w-full border-t pt-4">
          <Button variant="outline" asChild>
              <Link href="/admin/supplies/report">
                  Ver Relatório Completo
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <SupplyFormDialog 
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSave={handleSaveSupply}
        supply={supplyToEdit}
        defaultType={activeTab === 'all' ? 'ingredient' : activeTab}
      />

       <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                {viewMode === 'active' 
                ? `Isso irá arquivar o item "${selectedSupply?.name}". Ele não aparecerá mais nas listas de seleção.`
                : `Isso irá reativar o item "${selectedSupply?.name}". Ele voltará a aparecer nas listas de seleção.`}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
                Confirmar
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SupplyImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSuccess={onImportSuccess}
        defaultType={activeTab === 'all' ? 'ingredient' : activeTab}
      />
    </>
  );
}
