"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader, PlusCircle, Search, Trash2 } from "lucide-react";
import { updateTechnicalSheet } from "@/services";
import type { Supply, TechnicalSheet, TechnicalSheetComponent } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { useActiveTenant } from "@/hooks/use-active-tenant";

type RecipeFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  recipe: TechnicalSheet | null;
  supplies: Supply[];
  savedSheets: TechnicalSheet[];
};

const getDisplayUnit = (unit: Supply["unit"]) => {
  if (unit === "kg") return "g";
  if (unit === "L") return "ml";
  return unit;
};

const getCostPerDisplayUnit = (supply: Supply) => {
  if (supply.unit === "kg" || supply.unit === "L") {
    return supply.costPerUnit / 1000;
  }
  return supply.costPerUnit;
};

const parseNumericInput = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function RecipeFormDialog({
  isOpen,
  onClose,
  onSaveSuccess,
  recipe,
  supplies,
  savedSheets,
}: RecipeFormDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<Partial<Omit<TechnicalSheet, "id" | "createdAt" | "isActive">>>({});
  const [components, setComponents] = useState<TechnicalSheetComponent[]>([]);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedSupplyId, setSelectedSupplyId] = useState<string | null>(null);
  const [ingredientQuantityInput, setIngredientQuantityInput] = useState("");
  const { toast } = useToast();
  const firestore = useFirestore();
  const { activeTenantId } = useActiveTenant();

  const availableSupplies = useMemo(() => {
    return supplies.filter((supply) => supply.type !== "packaging");
  }, [supplies]);

  const filteredSupplies = useMemo(() => {
    const normalizedSearch = ingredientSearch.trim().toLowerCase();
    return availableSupplies.filter((supply) =>
      supply.name.toLowerCase().includes(normalizedSearch)
    );
  }, [availableSupplies, ingredientSearch]);

  const selectedSupply = useMemo(() => {
    if (!selectedSupplyId) return null;
    return availableSupplies.find((supply) => supply.id === selectedSupplyId) || null;
  }, [availableSupplies, selectedSupplyId]);

  const ingredientQuantity = useMemo(() => {
    return parseNumericInput(ingredientQuantityInput);
  }, [ingredientQuantityInput]);

  useEffect(() => {
    if (recipe && supplies.length > 0 && isOpen) {
      setComponents(recipe.components || []);
      setFormData({
        name: recipe.name,
        description: recipe.description,
        type: "base",
        components: recipe.components,
        steps: recipe.steps,
        yield: recipe.yield,
        lossFactor: recipe.lossFactor || 0,
        totalCost: recipe.totalCost,
      });
    } else {
      setComponents([]);
      setFormData({
        name: "",
        description: "",
        type: "base",
        components: [],
        steps: "",
        yield: "",
        lossFactor: 0,
        totalCost: 0,
      });
    }
  }, [recipe, supplies, isOpen]);

  useEffect(() => {
    if (!isAddIngredientOpen) {
      setIngredientSearch("");
      setSelectedSupplyId(null);
      setIngredientQuantityInput("");
    }
  }, [isAddIngredientOpen]);

  const updateComponentQuantity = (componentId: string, value: number) => {
    setComponents((previous) =>
      previous.map((component) =>
        component.componentId === componentId ? { ...component, quantity: value } : component
      )
    );
  };

  const removeItem = (componentId: string) => {
    setComponents((previous) => previous.filter((component) => component.componentId !== componentId));
  };

  const addIngredientFromModal = () => {
    if (!selectedSupply) {
      toast({ variant: "destructive", title: "Selecione um ingrediente" });
      return;
    }
    if (ingredientQuantity <= 0) {
      toast({ variant: "destructive", title: "Quantidade invalida" });
      return;
    }
    if (components.some((component) => component.componentId === selectedSupply.id)) {
      toast({
        variant: "destructive",
        title: "Ingrediente ja adicionado",
        description: "Remova o item atual para adicionar novamente.",
      });
      return;
    }

    const newComponent: TechnicalSheetComponent = {
      componentId: selectedSupply.id,
      componentName: selectedSupply.name,
      componentType: "supply",
      quantity: ingredientQuantity,
      unit: getDisplayUnit(selectedSupply.unit),
    };

    setComponents((previous) => [...previous, newComponent]);
    setIsAddIngredientOpen(false);
  };

  const getCost = useCallback(
    (component: TechnicalSheetComponent) => {
      let rawCost = 0;

      if (component.componentType === "supply") {
        const supply = supplies.find((s) => s.id === component.componentId);
        if (!supply) return 0;
        const costPerBaseUnit = getCostPerDisplayUnit(supply);
        rawCost = component.quantity * costPerBaseUnit;
      } else {
        const sheet = savedSheets.find((s) => s.id === component.componentId);
        if (!sheet || !sheet.yield) return 0;

        const yieldAmount = parseFloat(sheet.yield.replace(/[^0-9,.]/g, "").replace(",", "."));
        if (isNaN(yieldAmount) || yieldAmount === 0) return 0;

        const costPerGramOrMlOfSheet = sheet.totalCost / yieldAmount;
        rawCost = component.quantity * costPerGramOrMlOfSheet;
      }

      return rawCost;
    },
    [supplies, savedSheets]
  );

  const getUnitCost = useCallback(
    (component: TechnicalSheetComponent) => {
      if (component.componentType !== "supply") return 0;
      const supply = supplies.find((s) => s.id === component.componentId);
      if (!supply) return 0;
      return getCostPerDisplayUnit(supply);
    },
    [supplies]
  );

  const totalCost = useMemo(() => {
    const subTotal = components.reduce((total, item) => total + getCost(item), 0);
    return subTotal * (1 + (formData.lossFactor || 0) / 100);
  }, [components, getCost, formData.lossFactor]);

  const handleUpdateRecipe = async () => {
    if (!firestore || !recipe || !formData.name) return;
    if (components.length === 0) {
      toast({ variant: "destructive", title: "Receita vazia", description: "Adicione ingredientes a receita." });
      return;
    }

    setIsProcessing(true);
    try {
      const dataToUpdate: Partial<Omit<TechnicalSheet, "id" | "createdAt" | "isActive">> = {
        name: formData.name,
        description: formData.description,
        type: "base",
        components: components,
        steps: formData.steps,
        yield: formData.yield,
        lossFactor: formData.lossFactor,
        totalCost: totalCost,
        suggestedPrice: 0,
      };

      await updateTechnicalSheet(firestore, recipe.id, dataToUpdate, activeTenantId || undefined);

      toast({ title: "Receita Atualizada!", description: `"${formData.name}" foi atualizada.` });
      onSaveSuccess();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Atualizar", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
        <DialogContent className="w-[95vw] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Receita (Ficha de Base): {recipe?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2 sm:pr-6">
            <div className="grid gap-2">
              <Label htmlFor="edit-sheet-name">Nome da Receita</Label>
              <Input
                id="edit-sheet-name"
                name="edit-sheet-name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sheet-description">Breve Descricao</Label>
              <Textarea
                id="edit-sheet-description"
                name="edit-sheet-description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isProcessing}
              />
            </div>

            <div className="grid gap-2 border rounded-md p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label className="text-base font-semibold">Lista de Ingredientes</Label>
                <Button type="button" onClick={() => setIsAddIngredientOpen(true)} disabled={isProcessing}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Ingrediente
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Custo Unitario</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.length > 0 ? (
                      components.map((item) => (
                        <TableRow key={item.componentId}>
                          <TableCell className="font-medium">{item.componentName}</TableCell>
                          <TableCell className="w-[160px]">
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              value={item.quantity}
                              onChange={(event) =>
                                updateComponentQuantity(item.componentId, parseNumericInput(event.target.value))
                              }
                              disabled={isProcessing}
                            />
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            {getUnitCost(item).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell>
                            {getCost(item).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.componentId)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                          Nenhum ingrediente adicionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-sheet-steps">Modo de Preparo</Label>
              <Textarea
                id="edit-sheet-steps"
                name="edit-sheet-steps"
                value={formData.steps || ""}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                rows={5}
                disabled={isProcessing}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sheet-yield">Rendimento da Receita</Label>
                <Input
                  id="edit-sheet-yield"
                  name="edit-sheet-yield"
                  value={formData.yield || ""}
                  onChange={(e) => setFormData({ ...formData, yield: e.target.value })}
                  disabled={isProcessing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-loss-factor">Fator de Perda da Receita (%)</Label>
                <Input
                  id="edit-loss-factor"
                  name="edit-loss-factor"
                  type="number"
                  value={formData.lossFactor || 0}
                  onChange={(e) => setFormData({ ...formData, lossFactor: parseFloat(e.target.value) || 0 })}
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 border-t pt-4">
              <div className="flex flex-col gap-2">
                <Label>Custo Total da Receita</Label>
                <p className="font-bold text-lg">
                  {totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row">
            <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button className="w-full sm:w-auto" type="button" onClick={handleUpdateRecipe} disabled={isProcessing}>
              {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar ingrediente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ingredient-search-edit">Buscar ingrediente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ingredient-search-edit"
                  placeholder="Digite para buscar..."
                  className="pl-8"
                  value={ingredientSearch}
                  onChange={(event) => setIngredientSearch(event.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <ScrollArea className="h-44 rounded-md border p-2">
                <div className="space-y-1">
                  {filteredSupplies.map((supply) => {
                    const isSelected = selectedSupplyId === supply.id;
                    const isAdded = components.some((component) => component.componentId === supply.id);
                    return (
                      <button
                        key={supply.id}
                        type="button"
                        className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                        onClick={() => setSelectedSupplyId(supply.id)}
                        disabled={isAdded || isProcessing}
                        data-state={isSelected ? "selected" : "default"}
                      >
                        <span className="font-medium">{supply.name}</span>
                        {isAdded && <span className="ml-2 text-xs text-muted-foreground">(ja adicionado)</span>}
                      </button>
                    );
                  })}
                  {filteredSupplies.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground">Nenhum ingrediente encontrado.</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ingredient-quantity-edit">Quantidade</Label>
                <Input
                  id="ingredient-quantity-edit"
                  type="number"
                  min="0"
                  step="0.001"
                  value={ingredientQuantityInput}
                  onChange={(event) => setIngredientQuantityInput(event.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ingredient-unit-edit">Unidade</Label>
                <Input
                  id="ingredient-unit-edit"
                  value={selectedSupply ? getDisplayUnit(selectedSupply.unit) : ""}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsAddIngredientOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              onClick={addIngredientFromModal}
              disabled={!selectedSupply || ingredientQuantity <= 0 || isProcessing}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
