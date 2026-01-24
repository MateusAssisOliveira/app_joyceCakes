
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useAuth } from '@/firebase';
import { collection, query } from 'firebase/firestore';
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
import { addSupply, updateSupply, inactivateSupply, reactivateSupply } from "@/services";
import type { Supply } from "@/types";
import { useToast } from "@/hooks/use-toast";

import { SupplyFormDialog } from "@/components/admin/supplies/supply-form-dialog";
import { SupplyDetailsSheet } from "@/components/admin/supplies/supply-details-sheet";
import { SupplyImportDialog } from "@/components/admin/supplies/supply-import-dialog";
import { SupplyActions } from "@/components/admin/supplies/supply-actions";
import { SupplyTable } from "@/components/admin/supplies/supply-table";

type InventoryClientProps = {
  itemType: 'ingredient' | 'packaging';
  title: string;
  description: string;
  reportUrl: string;
}

export function InventoryClient({ itemType, title, description, reportUrl }: InventoryClientProps) {
  const [selectedSupplyId, setSelectedSupplyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [supplyToEdit, setSupplyToEdit] = useState<Supply | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const { toast } = useToast();

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  // 1. Busca TODOS os insumos, sem filtro de 'type' na consulta.
  const suppliesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'supplies'));
  }, [firestore, user]);

  const { data: allSupplies, isLoading, error } = useCollection<Supply>(suppliesQuery);
  
  const filteredSupplies = useMemo(() => {
    if (!allSupplies) return [];
    
    // 2. Aplica o filtro de 'type' aqui, no lado do cliente.
    const itemsByType = allSupplies.filter(s => {
        if (itemType === 'ingredient') {
            // Um item é um ingrediente se o tipo dele NÃO for 'packaging'.
            // Isso inclui itens onde o campo 'type' está vazio ou nulo.
            return s.type !== 'packaging';
        } else { // itemType === 'packaging'
            // Um item é uma embalagem se o tipo for EXATAMENTE 'packaging'.
            return s.type === 'packaging';
        }
    });

    const result = itemsByType.filter(s => {
        const isItemActive = s.isActive !== false;
        const matchesViewMode = viewMode === 'active' ? isItemActive : !isItemActive;
        const nameMatches = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesViewMode && nameMatches;
    });
    
    return result;
  }, [allSupplies, searchTerm, viewMode, itemType]);
  
  const selectedSupply = useMemo(() => {
      return allSupplies?.find(s => s.id === selectedSupplyId) || null;
  }, [allSupplies, selectedSupplyId]);

  useEffect(() => {
    setSelectedSupplyId(null);
  }, [viewMode, searchTerm]);
  
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

    const dataToSave = { ...formData, type: formData.type || itemType };
    
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
  
  const handleConfirmAction = useCallback(() => {
    if (!selectedSupply || !firestore) return;
    
    if (viewMode === 'active') {
      inactivateSupply(firestore, selectedSupply.id);
      toast({ title: "Item Arquivado" });
    } else {
      reactivateSupply(firestore, selectedSupply.id);
      toast({ title: "Item Reativado" });
    }
    setSelectedSupplyId(null);
    setIsConfirmDialogOpen(false);
  }, [selectedSupply, firestore, viewMode, toast]);

  const showLoading = isUserLoading || (isLoading && !allSupplies);
  
  const onImportSuccess = () => {
    setIsImportDialogOpen(false);
    toast({ title: "Importação bem-sucedida!", description: "Seus itens foram adicionados ao estoque." });
  };

  const handleRowClick = (supply: Supply) => {
    setSelectedSupplyId(supply.id);
  }

  const handleRowDoubleClick = (supply: Supply) => {
    handleOpenFormDialog(supply);
  };
  
  const handleViewDetails = (supply: Supply) => {
    setSelectedSupplyId(supply.id);
    setIsDetailsSheetOpen(true);
  }
  

  return (
    <>
      <Card className="w-full flex-1 flex flex-col h-full min-h-0">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                 <SupplyActions
                    onAdd={() => handleOpenFormDialog(null)}
                    onImport={() => setIsImportDialogOpen(true)}
                    onArchive={() => setIsConfirmDialogOpen(true)}
                    isArchiveActionDisabled={!selectedSupply}
                    archiveButtonLabel={viewMode === 'active' ? 'Arquivar' : 'Reativar'}
                 />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:flex-1">
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
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          {showLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <SupplyTable
                supplies={filteredSupplies}
                selectedSupplyId={selectedSupplyId}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onEdit={handleOpenFormDialog}
                onViewDetails={handleViewDetails}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-start w-full border-t pt-4">
          <Button variant="outline" asChild>
              <Link href={reportUrl}>
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
        defaultType={itemType}
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

      <SupplyDetailsSheet 
        supply={selectedSupply}
        isOpen={isDetailsSheetOpen}
        onOpenChange={setIsDetailsSheetOpen}
      />

      <SupplyImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSuccess={onImportSuccess}
        defaultType={itemType}
      />
    </>
  );
}
