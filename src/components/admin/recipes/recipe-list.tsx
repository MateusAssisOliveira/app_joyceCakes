
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import { Edit, Trash, Loader, ArchiveRestore } from "lucide-react";
import { inactivateTechnicalSheet, reactivateTechnicalSheet } from "@/services";
import type { TechnicalSheet } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";

type RecipesListProps = {
    isLoading: boolean;
    recipes: TechnicalSheet[];
    onEditRecipe: (recipe: TechnicalSheet) => void;
    onUpdate: () => void;
}

export function RecipeList({ isLoading, recipes, onEditRecipe, onUpdate }: RecipesListProps) {
    const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const filteredRecipes = useMemo(() => {
      if (!recipes) {
         return [];
      }
      // Filtra para mostrar apenas fichas de base
      const result = recipes.filter(recipe => {
          const isRecipeActive = recipe.isActive !== false;
          const matchesViewMode = viewMode === 'active' ? isRecipeActive : !isRecipeActive;
          const isBaseType = recipe.type === 'base';
          return matchesViewMode && isBaseType;
      });
      return result;
    }, [recipes, viewMode]);

    const selectedRecipe = useMemo(() => {
        return recipes?.find(r => r.id === selectedRecipeId) || null;
    }, [recipes, selectedRecipeId]);

    useEffect(() => {
        setSelectedRecipeId(null);
    }, [viewMode]);
    
    const handleConfirmAction = useCallback(async () => {
        if(!selectedRecipe || !firestore) return;
        
        try {
            if (viewMode === 'active') {
                await inactivateTechnicalSheet(firestore, selectedRecipe.id);
                toast({ title: "Receita Arquivada!" });
            } else {
                await reactivateTechnicalSheet(firestore, selectedRecipe.id);
                toast({ title: "Receita Reativada!" });
            }
            setSelectedRecipeId(null);
            setIsConfirmDialogOpen(false);
            onUpdate(); // Chama a função para recarregar os dados no pai
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro", description: error.message });
        }
    }, [selectedRecipe, firestore, viewMode, toast, onUpdate]);

    return (
        <>
        <Card className="w-full flex-1 flex flex-col">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Livro de Receitas</CardTitle>
                        <CardDescription>Clique em uma receita para selecionar e gerenciar.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={() => selectedRecipe && onEditRecipe(selectedRecipe)} disabled={!selectedRecipe} className="w-full sm:w-auto">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setIsConfirmDialogOpen(true)}
                          disabled={!selectedRecipe} 
                          className="w-full sm:w-auto"
                        >
                            {viewMode === 'active' ? <><Trash className="mr-2 h-4 w-4" />Arquivar</> : <><ArchiveRestore className="mr-2 h-4 w-4" />Reativar</>}
                        </Button>
                    </div>
                </div>
                 <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                    <Select name="recipe-view-mode" value={viewMode} onValueChange={(value: "active" | "archived") => setViewMode(value)}>
                        <SelectTrigger id="recipe-view-mode" className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Ver status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Ver Ativas</SelectItem>
                            <SelectItem value="archived">Ver Arquivadas</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map(recipe => (
                    <div key={recipe.id} onClick={() => setSelectedRecipeId(recipe.id)} className="cursor-pointer">
                      <Card 
                        data-state={selectedRecipeId === recipe.id ? 'selected' : ''}
                        className="data-[state=selected]:bg-accent data-[state=selected]:ring-2 data-[state=selected]:ring-primary h-full"
                      >
                        <CardHeader>
                            <CardTitle className="truncate">{recipe.name}</CardTitle>
                            <CardDescription className="line-clamp-2 h-10">{recipe.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Custo Total:</span>
                            <span className="font-bold">{recipe.totalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                          </div>
                           <div className="flex justify-between">
                            <span className="text-muted-foreground">Rendimento:</span>
                            <span className="font-medium">{recipe.yield}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                   {filteredRecipes.length === 0 && (
                      <p className="text-muted-foreground text-center col-span-full py-10">Nenhuma receita encontrada para os filtros aplicados.</p>
                  )}
                </div>
            )}
          </CardContent>
        </Card>
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    {viewMode === 'active' 
                    ? `Isso irá arquivar a receita "${selectedRecipe?.name}".`
                    : `Isso irá reativar a receita "${selectedRecipe?.name}".`}
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
        </>
    )
}
