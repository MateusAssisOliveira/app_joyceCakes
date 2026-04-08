"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import { PlusCircle, Trash2, Search, BookMarked, Loader, Info, ChevronsUpDown } from "lucide-react";
import { addTechnicalSheet } from "@/services";
import type { Supply, TechnicalSheet, TechnicalSheetComponent } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore } from "@/firebase";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RecipeFormProps = {
  supplies: Supply[];
  savedSheets: TechnicalSheet[];
  onSaveSuccess: () => void;
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

export function RecipeForm({ supplies, savedSheets, onSaveSuccess }: RecipeFormProps) {
  const [components, setComponents] = useState<TechnicalSheetComponent[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [isRecipeStarted, setIsRecipeStarted] = useState(false);
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [lossFactorInput, setLossFactorInput] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedSupplyId, setSelectedSupplyId] = useState<string | null>(null);
  const [ingredientQuantityInput, setIngredientQuantityInput] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { activeTenantId } = useActiveTenant();
  void savedSheets;

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

  const selectedSupplyUnitCost = useMemo(() => {
    if (!selectedSupply) return 0;
    return getCostPerDisplayUnit(selectedSupply);
  }, [selectedSupply]);

  const selectedSupplyLineCost = useMemo(() => {
    return ingredientQuantity * selectedSupplyUnitCost;
  }, [ingredientQuantity, selectedSupplyUnitCost]);

  const updateComponentQuantity = (componentId: string, value: number) => {
    setComponents(
      components.map((component) =>
        component.componentId === componentId ? { ...component, quantity: value } : component
      )
    );
  };

  const removeItem = (componentId: string) => {
    setComponents(components.filter((component) => component.componentId !== componentId));
  };

  const getCost = useCallback((component: TechnicalSheetComponent) => {
    const supply = supplies.find((s) => s.id === component.componentId);
    if (!supply) return 0;
    const costPerBaseUnit = getCostPerDisplayUnit(supply);
    return component.quantity * costPerBaseUnit;
  }, [supplies]);

  const getUnitCost = useCallback((component: TechnicalSheetComponent) => {
    const supply = supplies.find((s) => s.id === component.componentId);
    if (!supply) return 0;
    return getCostPerDisplayUnit(supply);
  }, [supplies]);

  const parsedLossFactor = useMemo(() => {
    if (!lossFactorInput.trim()) return 0;
    return parseFloat(lossFactorInput.replace(",", ".")) || 0;
  }, [lossFactorInput]);

  const subTotal = useMemo(() => {
    return components.reduce((total, item) => total + getCost(item), 0);
  }, [components, getCost]);

  const totalCost = useMemo(() => {
    const safeLossFactor = parsedLossFactor < 0 ? 0 : parsedLossFactor;
    return subTotal * (1 + safeLossFactor / 100);
  }, [subTotal, parsedLossFactor]);

  const lossAmount = useMemo(() => {
    return totalCost - subTotal;
  }, [subTotal, totalCost]);

  const parsedYieldAmount = useMemo(() => {
    return parseFloat(yieldAmount.replace(",", ".")) || 0;
  }, [yieldAmount]);

  const costPerYieldUnit = useMemo(() => {
    if (parsedYieldAmount <= 0) return 0;
    return totalCost / parsedYieldAmount;
  }, [parsedYieldAmount, totalCost]);

  const totalQuantityByUnit = useMemo(() => {
    return components.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.unit] = (accumulator[item.unit] || 0) + item.quantity;
      return accumulator;
    }, {});
  }, [components]);

  const totalSuppliesQuantityLabel = useMemo(() => {
    const entries = Object.entries(totalQuantityByUnit);
    if (entries.length === 0) return "0";
    return entries
      .map(([unit, quantity]) => `${quantity.toLocaleString("pt-BR")} ${unit}`)
      .join(" + ");
  }, [totalQuantityByUnit]);

  const canSaveSheet = useMemo(() => {
    return (
      sheetName.trim().length > 0 &&
      components.length > 0 &&
      parsedYieldAmount > 0 &&
      yieldUnit.trim().length > 0
    );
  }, [sheetName, components.length, parsedYieldAmount, yieldUnit]);

  useEffect(() => {
    if (!isAddIngredientOpen) {
      setIngredientSearch("");
      setSelectedSupplyId(null);
      setIngredientQuantityInput("");
    }
  }, [isAddIngredientOpen]);

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

  const clearForm = () => {
    setComponents([]);
    setSheetName("");
    setDescription("");
    setSteps("");
    setYieldAmount("");
    setYieldUnit("");
    setLossFactorInput("");
    setIsAdvancedOpen(false);
    setIsRecipeStarted(false);
  };

  const handleStartRecipe = () => {
    if (!sheetName.trim()) {
      toast({ variant: "destructive", title: "Nome da receita e obrigatorio" });
      return;
    }
    setIsRecipeStarted(true);
  };

  const handleSaveSheet = async () => {
    if (!firestore) return;
    if (!sheetName.trim()) {
      toast({ variant: "destructive", title: "Nome da receita invalido" });
      return;
    }
    if (components.length === 0) {
      toast({ variant: "destructive", title: "Receita vazia", description: "Adicione ingredientes a receita." });
      return;
    }
    if (parsedYieldAmount <= 0 || !yieldUnit.trim()) {
      toast({ variant: "destructive", title: "Rendimento obrigatorio" });
      return;
    }

    const formattedYield = `${parsedYieldAmount.toString().replace(".", ",")} ${yieldUnit.trim()}`;
    const hasLossFactor = lossFactorInput.trim().length > 0;

    setIsProcessing(true);
    try {
      const sheetData: Omit<TechnicalSheet, "id" | "createdAt" | "isActive"> = {
        name: sheetName,
        description,
        type: "base",
        components,
        steps,
        yield: formattedYield,
        lossFactor: hasLossFactor ? parsedLossFactor : undefined,
        totalCost,
        suggestedPrice: 0,
      };

      await addTechnicalSheet(firestore, sheetData, activeTenantId || undefined);

      toast({
        title: "Receita salva",
        description: `A receita "${sheetName}" foi salva no livro.`,
      });
      clearForm();
      onSaveSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao salvar receita", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Etapa 1 - Nome da receita</CardTitle>
          <CardDescription>Preencha o nome e inicie a montagem da receita.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Label htmlFor="sheet-name">Nome da receita</Label>
          <Input
            id="sheet-name"
            name="sheet-name"
            placeholder="Ex: Massa de Chocolate"
            value={sheetName}
            onChange={(event) => setSheetName(event.target.value)}
            disabled={isProcessing}
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleStartRecipe} disabled={!sheetName.trim() || isProcessing}>
            Comecar Receita
          </Button>
        </CardFooter>
      </Card>

      {isRecipeStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>Etapa 2 - Lista de ingredientes</CardTitle>
                    <CardDescription>Adicione cada ingrediente ja com a quantidade definida.</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddIngredientOpen(true)} disabled={isProcessing}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Ingrediente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Nenhum ingrediente adicionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Etapa 4 - Rendimento</CardTitle>
                <CardDescription>Informe quanto a receita rende.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="yield-amount">Quantidade de rendimento</Label>
                  <Input
                    id="yield-amount"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Ex: 20"
                    value={yieldAmount}
                    onChange={(event) => setYieldAmount(event.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yield-unit">Unidade do rendimento</Label>
                  <Input
                    id="yield-unit"
                    placeholder="Ex: unidades, kg, bolo"
                    value={yieldUnit}
                    onChange={(event) => setYieldUnit(event.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Configuracoes Avancadas</CardTitle>
                    <CardDescription>Opcional. Use apenas quando necessario.</CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronsUpDown className="mr-2 h-4 w-4" />
                      {isAdvancedOpen ? "Recolher" : "Expandir"}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sheet-description">Breve descricao</Label>
                      <Textarea
                        id="sheet-description"
                        name="sheet-description"
                        placeholder="Observacoes gerais da receita."
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sheet-steps">Modo de preparo</Label>
                      <Textarea
                        id="sheet-steps"
                        name="sheet-steps"
                        placeholder="Passo 1: ..."
                        value={steps}
                        onChange={(event) => setSteps(event.target.value)}
                        rows={5}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="loss-factor" className="flex items-center gap-2">
                        Fator de perda (%)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Opcional. Ajusta o custo final para perdas no processo.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        id="loss-factor"
                        name="loss-factor"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 5"
                        value={lossFactorInput}
                        onChange={(event) => setLossFactorInput(event.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Card>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-6">
                <Button variant="outline" onClick={clearForm} disabled={isProcessing}>
                  Limpar Formulario
                </Button>
                <Button onClick={handleSaveSheet} disabled={!canSaveSheet || isProcessing}>
                  {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  {isProcessing ? "Salvando..." : (
                    <>
                      <BookMarked className="mr-2 h-4 w-4" />
                      Salvar Receita
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>Resumo em tempo real</CardTitle>
                <CardDescription>Atualizado automaticamente durante a montagem.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Alert>
                  <AlertDescription>
                    Receita atualiza custo tecnico. Nao registra entrada ou saida no fluxo de caixa.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-1">
                  <Label>Subtotal dos ingredientes</Label>
                  <p className="font-semibold text-base">
                    {subTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="grid gap-1">
                  <Label>Ajuste por perda</Label>
                  <p className="font-semibold text-base">
                    {lossAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    {" "}
                    <span className="text-xs text-muted-foreground">
                      ({parsedLossFactor.toLocaleString("pt-BR")}%)
                    </span>
                  </p>
                </div>
                <div className="grid gap-1">
                  <Label>Custo total da receita</Label>
                  <p className="font-bold text-xl">
                    {totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="grid gap-1">
                  <Label>Custo por unidade de rendimento</Label>
                  <p className="font-semibold text-base">
                    {costPerYieldUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    {yieldUnit.trim() ? ` / ${yieldUnit.trim()}` : ""}
                  </p>
                </div>
                <div className="grid gap-1">
                  <Label>Quantidade total de insumos</Label>
                  <p className="font-semibold text-base">{totalSuppliesQuantityLabel}</p>
                  <p className="text-xs text-muted-foreground">{components.length} ingrediente(s)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>Adicionar ingrediente</DialogTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/inventory">Ir para Estoque</Link>
              </Button>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ingredient-search">Buscar ingrediente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ingredient-search"
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
                <Label htmlFor="ingredient-quantity">Quantidade</Label>
                <Input
                  id="ingredient-quantity"
                  type="number"
                  min="0"
                  step="0.001"
                  value={ingredientQuantityInput}
                  onChange={(event) => setIngredientQuantityInput(event.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ingredient-unit">Unidade</Label>
                <Input
                  id="ingredient-unit"
                  value={selectedSupply ? getDisplayUnit(selectedSupply.unit) : ""}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Custo unitario</Label>
                <p className="font-semibold">
                  {selectedSupplyUnitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Custo total</Label>
                <p className="font-semibold">
                  {selectedSupplyLineCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
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
    </div>
  );
}
