
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Supply, TechnicalSheet } from "@/types";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeForm } from "@/components/admin/recipes/recipe-form";
import { RecipeList } from "@/components/admin/recipes/recipe-list";
import { RecipeFormDialog } from "@/components/admin/recipes/recipe-form-dialog";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, query } from "firebase/firestore";

export function RecipesClient() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const suppliesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'supplies'));
  }, [firestore, user]);
  const { data: supplies, isLoading: areSuppliesLoading } = useCollection<Supply>(suppliesQuery);

  const sheetsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'technical_sheets'));
  }, [firestore, user]);
  const { data: savedSheets, isLoading: areSheetsLoading } = useCollection<TechnicalSheet>(sheetsQuery);

  const isLoading = areSuppliesLoading || areSheetsLoading;

  const [activeTab, setActiveTab] = useState<'new-recipe' | 'manage-recipes'>('new-recipe');
  const [sheetToEdit, setSheetToEdit] = useState<TechnicalSheet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (sheet: TechnicalSheet) => {
    setSheetToEdit(sheet);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSheetToEdit(null);
    setIsDialogOpen(false);
  };
  
  const handleSaveSuccess = async () => {
    handleCloseDialog();
    // A re-fetch não é mais necessária, o useCollection cuida disso.
    if (activeTab === 'new-recipe') {
        setActiveTab('manage-recipes');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="new-recipe" className="py-2 text-xs sm:text-sm">Nova Receita</TabsTrigger>
          <TabsTrigger value="manage-recipes" className="py-2 text-xs sm:text-sm">Gerenciar Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="new-recipe" className="flex-1 mt-6">
          <RecipeForm supplies={supplies || []} savedSheets={savedSheets || []} onSaveSuccess={handleSaveSuccess} />
        </TabsContent>
        <TabsContent value="manage-recipes" className="flex-1 flex flex-col mt-6">
          <RecipeList 
            isLoading={isLoading}
            recipes={savedSheets || []}
            onEditRecipe={handleOpenDialog}
            onUpdate={() => {}}
          />
        </TabsContent>
      </Tabs>
       <RecipeFormDialog 
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSaveSuccess={handleSaveSuccess}
        recipe={sheetToEdit}
        supplies={supplies || []}
        savedSheets={savedSheets || []}
       />
    </>
  );
}
