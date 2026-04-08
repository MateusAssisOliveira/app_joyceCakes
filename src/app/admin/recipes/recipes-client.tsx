"use client";

import { useEffect, useMemo, useState } from "react";
import type { Supply, TechnicalSheet } from "@/types";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeForm } from "@/components/admin/recipes/recipe-form";
import { RecipeList } from "@/components/admin/recipes/recipe-list";
import { RecipeFormDialog } from "@/components/admin/recipes/recipe-form-dialog";
import { Loader } from "lucide-react";
import { collection, query } from "firebase/firestore";
import { getTenantCollectionPath } from "@/lib/tenant";
import { useActiveTenant } from "@/hooks/use-active-tenant";

export function RecipesClient() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { activeTenantId } = useActiveTenant();

  const suppliesQuery = useMemo(() => {
    if (!firestore || !activeTenantId) return null;
    console.log("[Recipes] query supplies", {
      tenantId: activeTenantId,
      path: getTenantCollectionPath(activeTenantId, "supplies"),
    });
    return query(collection(firestore, getTenantCollectionPath(activeTenantId, "supplies")));
  }, [firestore, activeTenantId]);

  const {
    data: supplies,
    isLoading: areSuppliesLoading,
    error: suppliesError,
  } = useCollection<Supply>(suppliesQuery);

  const sheetsQuery = useMemo(() => {
    if (!firestore || !activeTenantId) return null;
    console.log("[Recipes] query technical_sheets", {
      tenantId: activeTenantId,
      path: getTenantCollectionPath(activeTenantId, "technical_sheets"),
    });
    return query(collection(firestore, getTenantCollectionPath(activeTenantId, "technical_sheets")));
  }, [firestore, activeTenantId]);

  const {
    data: savedSheets,
    isLoading: areSheetsLoading,
    error: sheetsError,
  } = useCollection<TechnicalSheet>(sheetsQuery);

  const isLoading = areSuppliesLoading || areSheetsLoading;

  const [activeTab, setActiveTab] = useState<"new-recipe" | "manage-recipes">("new-recipe");
  const [sheetToEdit, setSheetToEdit] = useState<TechnicalSheet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (sheet: TechnicalSheet) => {
    console.log("[Recipes] open edit dialog", { id: sheet.id, name: sheet.name });
    setSheetToEdit(sheet);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    console.log("[Recipes] close edit dialog");
    setSheetToEdit(null);
    setIsDialogOpen(false);
  };

  const handleSaveSuccess = async () => {
    console.log("[Recipes] save success");
    handleCloseDialog();
    if (activeTab === "new-recipe") {
      setActiveTab("manage-recipes");
    }
  };

  useEffect(() => {
    console.log("[Recipes] init", {
      userId: user?.uid ?? null,
      tenantId: activeTenantId ?? null,
      hasFirestore: Boolean(firestore),
    });
  }, [user?.uid, activeTenantId, firestore]);

  useEffect(() => {
    console.log("[Recipes] loading state", {
      isLoading,
      areSuppliesLoading,
      areSheetsLoading,
    });
  }, [isLoading, areSuppliesLoading, areSheetsLoading]);

  useEffect(() => {
    console.log("[Recipes] dataset", {
      suppliesCount: supplies?.length ?? 0,
      recipesCount: savedSheets?.length ?? 0,
      tenantId: activeTenantId ?? null,
    });
  }, [supplies, savedSheets, activeTenantId]);

  useEffect(() => {
    if (!suppliesError) return;
    console.error("[Recipes] supplies query error", {
      error: suppliesError.message,
      tenantId: activeTenantId ?? null,
    });
  }, [suppliesError, activeTenantId]);

  useEffect(() => {
    if (!sheetsError) return;
    console.error("[Recipes] technical_sheets query error", {
      error: sheetsError.message,
      tenantId: activeTenantId ?? null,
    });
  }, [sheetsError, activeTenantId]);

  useEffect(() => {
    console.log("[Recipes] active tab", { activeTab });
  }, [activeTab]);

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
