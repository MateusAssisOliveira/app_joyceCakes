

"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "lucide-react";
import { updateTechnicalSheet } from "@/services";
import type { Supply, TechnicalSheet, TechnicalSheetComponent } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";

type RecipeFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  recipe: TechnicalSheet | null;
  supplies: Supply[];
  savedSheets: TechnicalSheet[];
};

export function RecipeFormDialog({ isOpen, onClose, onSaveSuccess, recipe, supplies, savedSheets }: RecipeFormDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<Partial<Omit<TechnicalSheet, 'id' | 'createdAt' | 'isActive'>>>({});
  const [components, setComponents] = useState<Omit<TechnicalSheetComponent, 'lossFactor'>[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (recipe && supplies.length > 0 && isOpen) {
      setComponents(recipe.components || []);
      setFormData({
        name: recipe.name,
        description: recipe.description,
        type: 'base',
        components: recipe.components,
        steps: recipe.steps,
        yield: recipe.yield,
        lossFactor: recipe.lossFactor || 0,
        totalCost: recipe.totalCost,
      });
    } else {
       setComponents([]);
       setFormData({
            name: "", description: "", type: 'base', components: [], steps: "", 
            yield: "", lossFactor: 0, totalCost: 0,
       });
    }
  }, [recipe, supplies, isOpen]);
  
  const getCost = (component: Omit<TechnicalSheetComponent, 'lossFactor'>) => {
    let rawCost = 0;
    if (component.componentType === 'supply') {
        const supply = supplies.find(s => s.id === component.componentId);
        if (!supply) return 0;
        
        let costPerBaseUnit = supply.costPerUnit;
        if (supply.unit === 'kg' || supply.unit === 'L') {
            costPerBaseUnit /= 1000;
        }
        rawCost = component.quantity * costPerBaseUnit;

    } else { // 'sheet'
        const sheet = savedSheets.find(s => s.id === component.componentId);
        if (!sheet || !sheet.yield) return 0;
        
        const yieldAmount = parseFloat(sheet.yield.replace(/[^0-9,.]/g, '').replace(',', '.'));
        if(isNaN(yieldAmount) || yieldAmount === 0) return 0;

        const costPerGramOrMlOfSheet = sheet.totalCost / yieldAmount;
        rawCost = component.quantity * costPerGramOrMlOfSheet;
    }
    return rawCost;
  };

  const totalCost = useMemo(() => {
    const subTotal = components.reduce((total, item) => total + getCost(item), 0);
    return subTotal * (1 + (formData.lossFactor || 0) / 100);
  }, [components, supplies, savedSheets, formData.lossFactor]);

  const handleUpdateRecipe = async () => {
    if (!firestore || !recipe || !formData.name) return;

    setIsProcessing(true);
    try {
      const dataToUpdate: Partial<Omit<TechnicalSheet, 'id' | 'createdAt' | 'isActive'>> = {
        name: formData.name,
        description: formData.description,
        type: 'base',
        components: components,
        steps: formData.steps,
        yield: formData.yield,
        lossFactor: formData.lossFactor,
        totalCost: totalCost,
        suggestedPrice: 0,
      };

      await updateTechnicalSheet(firestore, recipe.id, dataToUpdate);

      toast({ title: "Receita Atualizada!", description: `"${formData.name}" foi atualizada.` });
      onSaveSuccess();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Atualizar", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Receita (Ficha de Base): {recipe?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2 sm:pr-6">
           <div className="grid gap-2">
              <Label htmlFor="edit-sheet-name">Nome da Receita</Label>
              <Input id="edit-sheet-name" name="edit-sheet-name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isProcessing}/>
            </div>
           <div className="grid gap-2">
            <Label htmlFor="edit-sheet-description">Breve Descrição</Label>
            <Textarea id="edit-sheet-description" name="edit-sheet-description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} disabled={isProcessing}/>
          </div>
           <div className="grid gap-2">
            <Label htmlFor="edit-sheet-steps">Modo de Preparo</Label>
            <Textarea id="edit-sheet-steps" name="edit-sheet-steps" value={formData.steps || ''} onChange={(e) => setFormData({...formData, steps: e.target.value})} rows={5} disabled={isProcessing}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="edit-sheet-yield">Rendimento da Receita</Label>
                <Input id="edit-sheet-yield" name="edit-sheet-yield" value={formData.yield || ''} onChange={e => setFormData({...formData, yield: e.target.value})} disabled={isProcessing}/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="edit-loss-factor">Fator de Perda da Receita (%)</Label>
                <Input id="edit-loss-factor" name="edit-loss-factor" type="number" value={formData.lossFactor || 0} onChange={e => setFormData({...formData, lossFactor: parseFloat(e.target.value) || 0})} disabled={isProcessing}/>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 border-t pt-4">
            <div className="flex flex-col gap-2"><Label>Custo Total da Receita</Label><p className="font-bold text-lg">{totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</p></div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row">
          <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
          <Button className="w-full sm:w-auto" type="button" onClick={handleUpdateRecipe} disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
