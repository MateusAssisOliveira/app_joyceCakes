

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
import { PlusCircle, Trash2, Search, Loader, Save, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { addProduct, updateProduct } from "@/services";
import type { Supply, TechnicalSheet, TechnicalSheetComponent, Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore } from "@/firebase";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ITEMS_PER_PAGE = 5;

type ProductFormProps = {
  product: Product | null;
  supplies: Supply[];
  baseSheets: TechnicalSheet[];
  onSaveSuccess: () => void;
};

export function ProductForm({ product, supplies, baseSheets, onSaveSuccess }: ProductFormProps) {
  const parseNumericInput = (value: string) => {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const [components, setComponents] = useState<Omit<TechnicalSheetComponent, 'lossFactor'>[]>([]);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  
  const [pricingMode, setPricingMode] = useState<"markup" | "price">("markup");
  const [markup, setMarkup] = useState(150);
  const [manualPriceInput, setManualPriceInput] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preparationTime, setPreparationTime] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [fixedCost, setFixedCost] = useState(0);

  const [suppliesPage, setSuppliesPage] = useState(1);
  const [sheetsPage, setSheetsPage] = useState(1);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { activeTenantId } = useActiveTenant();

  useEffect(() => {
    if (product) {
      setProductName(product.name);
      setDescription(product.description || "");
      setCategory(product.category || "");
      setComponents(product.components || []);
      setPreparationTime(product.preparationTime || 0);
      setLaborCost(product.laborCost || 0);
      setFixedCost(product.fixedCost || 0);

      const cost = product.costPrice || 0;
      const price = product.price || 0;
      if (cost > 0) {
        const newMarkup = ((price / cost) - 1) * 100;
        setMarkup(isFinite(newMarkup) ? newMarkup : 150);
      } else {
        setMarkup(150);
      }
      setManualPriceInput(String(price || 0));

    } else {
      setProductName("");
      setDescription("");
      setCategory("");
      setComponents([]);
      setPreparationTime(0);
      setLaborCost(0);
      setFixedCost(0);
      setMarkup(150);
      setPricingMode("markup");
      setManualPriceInput("0");
    }
  }, [product]);

  // --- LOGICA DA LISTA DE COMPONENTES ---
  const filteredSupplies = useMemo(() => {
    return supplies.filter((supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplies, searchTerm]);

  const filteredSheets = useMemo(() => {
    return baseSheets.filter((sheet) =>
      sheet.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [baseSheets, searchTerm]);

  const totalSuppliesPages = Math.ceil(filteredSupplies.length / ITEMS_PER_PAGE);
  const paginatedSupplies = useMemo(() => {
    const startIndex = (suppliesPage - 1) * ITEMS_PER_PAGE;
    return filteredSupplies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSupplies, suppliesPage]);

  const totalSheetsPages = Math.ceil(filteredSheets.length / ITEMS_PER_PAGE);
  const paginatedSheets = useMemo(() => {
    const startIndex = (sheetsPage - 1) * ITEMS_PER_PAGE;
    return filteredSheets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSheets, sheetsPage]);

  useEffect(() => {
    setSuppliesPage(1);
    setSheetsPage(1);
  }, [searchTerm]);


  // --- LOGICA DO FORMULARIO ---
  const addComponent = (item: Supply | TechnicalSheet, type: 'supply' | 'sheet') => {
    if (components.find((c) => c.componentId === item.id)) return;
    
    let unit = 'un';
    if (type === 'supply') {
      const supply = item as Supply;
      if (supply.unit === 'kg') unit = 'g';
      else if (supply.unit === 'L') unit = 'ml';
      else unit = supply.unit;
    } else {
      const sheet = item as TechnicalSheet;
      const yieldMatch = sheet.yield.match(/[a-zA-Z]+/);
      unit = yieldMatch ? yieldMatch[0] : 'g';
    }

    const newComponent: Omit<TechnicalSheetComponent, 'lossFactor'> = {
      componentId: item.id,
      componentName: item.name,
      componentType: type,
      quantity: 0,
      unit: unit,
    };
    setComponents([...components, newComponent]);
  };

  const updateComponentQuantity = (componentId: string, value: number) => {
    setComponents(
      components.map((c) =>
        c.componentId === componentId ? { ...c, quantity: value } : c
      )
    );
  };
  
  const removeItem = (componentId: string) => {
    setComponents(components.filter(c => c.componentId !== componentId));
  }

  const getCost = useCallback((component: Omit<TechnicalSheetComponent, 'lossFactor'>) => {
    let rawCost = 0;
    if (component.componentType === 'supply') {
        const supply = supplies.find(s => s.id === component.componentId);
        if (!supply) return 0;
        
        let costPerBaseUnit = supply.costPerUnit;
        if (supply.unit === 'kg' || supply.unit === 'L') {
            costPerBaseUnit /= 1000;
        }
        rawCost = component.quantity * costPerBaseUnit;

    } else {
        const sheet = baseSheets.find(s => s.id === component.componentId);
        if (!sheet || !sheet.yield) return 0;
        
        const yieldAmount = parseFloat(sheet.yield.replace(/[^0-9,.]/g, '').replace(',', '.'));
        if(isNaN(yieldAmount) || yieldAmount === 0) return 0;

        const costPerGramOfSheet = sheet.totalCost / yieldAmount;
        rawCost = component.quantity * costPerGramOfSheet;
    }
    return rawCost;
  }, [supplies, baseSheets]);

  const materialCost = useMemo(() => {
    return components.reduce((total, item) => total + getCost(item), 0);
  }, [components, getCost]);

  const totalLaborCost = useMemo(() => {
    if (laborCost === 0 || preparationTime === 0) return 0;
    return (preparationTime / 60) * laborCost;
  }, [preparationTime, laborCost]);

  const totalCost = useMemo(() => materialCost + totalLaborCost + fixedCost, [materialCost, totalLaborCost, fixedCost]);

  const manualPrice = useMemo(() => parseNumericInput(manualPriceInput), [manualPriceInput]);

  const suggestedPrice = useMemo(() => {
    if (pricingMode === "price") {
      return manualPrice;
    }
    return totalCost * (1 + (markup / 100));
  }, [pricingMode, totalCost, markup, manualPrice]);
  
  const profit = useMemo(() => suggestedPrice - totalCost, [suggestedPrice, totalCost]);

  const finalMargin = useMemo(() => {
    if (suggestedPrice === 0) return 0;
    return (profit / suggestedPrice) * 100;
  }, [profit, suggestedPrice]);

  const impliedMarkup = useMemo(() => {
    if (totalCost <= 0) return 0;
    return ((suggestedPrice / totalCost) - 1) * 100;
  }, [suggestedPrice, totalCost]);

  const handleSaveProduct = async () => {
    if (!firestore) return;
    if (!productName.trim()) {
        toast({ variant: "destructive", title: "Nome do Produto Inválido" });
        return;
    }
     if (pricingMode === "markup" && markup < 0) {
        toast({ variant: "destructive", title: "Markup Inválido", description: "O markup não pode ser negativo." });
        return;
    }
    if (pricingMode === "price" && manualPrice < 0) {
        toast({ variant: "destructive", title: "Preço Inválido", description: "O preço final não pode ser negativo." });
        return;
    }

    setIsProcessing(true);
    try {
      const productData = {
        name: productName,
        description,
        category,
        price: suggestedPrice,
        costPrice: totalCost,
        components,
        preparationTime,
        laborCost,
        fixedCost,
        imageUrlId: product?.imageUrlId || "product-desserts-1",
        stock_quantity: product?.stock_quantity || 0,
      };

      if (product && product.id) {
        await updateProduct(firestore, product.id, productData, activeTenantId || undefined);
        toast({ title: "Produto Atualizado!", description: `"${productName}" foi atualizado.` });
      } else {
        await addProduct(firestore, productData, activeTenantId || undefined);
        toast({ title: "Produto Adicionado!", description: `"${productName}" foi adicionado ao catálogo.` });
      }
      
      onSaveSuccess();
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erro ao Salvar Produto", description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start h-full">
        {/* Coluna de Componentes */}
        <div className="lg:col-span-1 h-full flex flex-col">
            <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader>
                    <CardTitle>Componentes Disponíveis</CardTitle>
                    <div className="relative pt-2">
                        <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs font-bold text-muted-foreground px-2">INGREDIENTES & EMBALAGENS</Label>
                            <div className="space-y-2 md:hidden">
                                {paginatedSupplies.map((supply) => (
                                  <div key={supply.id} className="flex items-center justify-between rounded-md border p-2">
                                    <span className="text-sm">{supply.name}</span>
                                    <Button size="sm" variant="outline" onClick={() => addComponent(supply, 'supply')} disabled={components.some(c => c.componentId === supply.id)}>
                                      <PlusCircle className="h-4 w-4 mr-1" />
                                      Adicionar
                                    </Button>
                                  </div>
                                ))}
                            </div>
                            <div className="hidden md:block">
                              <Table>
                                  <TableBody>
                                      {paginatedSupplies.map((supply) => (
                                      <TableRow key={supply.id} className="cursor-pointer" onClick={() => addComponent(supply, 'supply')}>
                                          <TableCell className="py-2">{supply.name}</TableCell>
                                          <TableCell className="text-right py-2">
                                          <Button size="icon" variant="ghost" disabled={components.some(c => c.componentId === supply.id)}>
                                              <PlusCircle className="h-4 w-4" />
                                          </Button>
                                          </TableCell>
                                      </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                            </div>
                            <div className="flex items-center justify-end space-x-2 py-2">
                                <Button variant="outline" size="sm" onClick={() => setSuppliesPage(p => p - 1)} disabled={suppliesPage === 1}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
                                <Button variant="outline" size="sm" onClick={() => setSuppliesPage(p => p + 1)} disabled={suppliesPage >= totalSuppliesPages}>Próximo <ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-muted-foreground px-2 mt-4 block">RECEITAS (FICHAS DE BASE)</Label>
                            <div className="space-y-2 md:hidden">
                                {paginatedSheets.map((sheet) => (
                                  <div key={sheet.id} className="flex items-center justify-between rounded-md border p-2">
                                    <span className="text-sm">{sheet.name}</span>
                                    <Button size="sm" variant="outline" onClick={() => addComponent(sheet, 'sheet')} disabled={components.some(c => c.componentId === sheet.id)}>
                                      <PlusCircle className="h-4 w-4 mr-1" />
                                      Adicionar
                                    </Button>
                                  </div>
                                ))}
                            </div>
                            <div className="hidden md:block">
                              <Table>
                                  <TableBody>
                                      {paginatedSheets.map((sheet) => (
                                      <TableRow key={sheet.id} className="cursor-pointer" onClick={() => addComponent(sheet, 'sheet')}>
                                          <TableCell className="py-2">{sheet.name}</TableCell>
                                          <TableCell className="text-right py-2">
                                          <Button size="icon" variant="ghost" disabled={components.some(c => c.componentId === sheet.id)}>
                                              <PlusCircle className="h-4 w-4" />
                                          </Button>
                                          </TableCell>
                                      </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                            </div>
                             <div className="flex items-center justify-end space-x-2 py-2">
                                <Button variant="outline" size="sm" onClick={() => setSheetsPage(p => p - 1)} disabled={sheetsPage === 1}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
                                <Button variant="outline" size="sm" onClick={() => setSheetsPage(p => p + 1)} disabled={sheetsPage >= totalSheetsPages}>Próximo <ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Coluna de Formulário do Produto */}
        <div className="lg:col-span-2 h-full flex flex-col">
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto px-1 pr-0 md:pr-4">
                <CardHeader className="p-0">
                    <CardTitle>Montagem do Produto</CardTitle>
                    <CardDescription>Defina os detalhes, adicione componentes e calcule o preço do seu produto final.</CardDescription>
                </CardHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="product-name">Nome do Produto</Label>
                        <Input id="product-name" placeholder="Ex: Bolo de Pote de Chocolate" value={productName} onChange={(e) => setProductName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="product-category">Categoria</Label>
                        <Input id="product-category" placeholder="Ex: Bolos, Sobremesas" value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="product-description">Descrição</Label>
                    <Textarea id="product-description" placeholder="Descreva o produto final para seus clientes." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                    <Label>Componentes do Produto</Label>
                    <Card className="mt-2">
                        <CardContent className="p-2">
                            <ScrollArea className="h-40">
                                <div className="space-y-2 md:hidden">
                                    {components.length > 0 ? (
                                      components.map((item) => (
                                        <div key={item.componentId} className="rounded-md border p-2">
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-sm">{item.componentName}</p>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.componentId)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                          </div>
                                          <div className="mt-2 grid grid-cols-3 gap-2 items-end">
                                            <Input type="number" className="h-8" value={item.quantity} onChange={(e) => updateComponentQuantity(item.componentId, parseFloat(e.target.value) || 0)} min="0" />
                                            <span className="text-xs text-muted-foreground">{item.unit}</span>
                                            <span className="text-right text-sm">{getCost(item).toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="h-24 rounded-md border text-center text-sm text-muted-foreground flex items-center justify-center">Adicione componentes da lista ao lado.</div>
                                    )}
                                </div>
                                <div className="hidden md:block">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead className="w-3/5">Componente</TableHead>
                                              <TableHead>Qtd.</TableHead>
                                              <TableHead>Un.</TableHead>
                                              <TableHead className="text-right">Custo</TableHead>
                                              <TableHead className="text-right">Ação</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {components.length > 0 ? (
                                              components.map((item) => (
                                              <TableRow key={item.componentId}>
                                                  <TableCell className="font-medium py-1">{item.componentName}</TableCell>
                                                  <TableCell className="py-1">
                                                      <Input type="number" className="w-20 h-8" value={item.quantity} onChange={(e) => updateComponentQuantity(item.componentId, parseFloat(e.target.value) || 0)} min="0" />
                                                  </TableCell>
                                                  <TableCell className="text-xs text-muted-foreground py-1">{item.unit}</TableCell>
                                                  <TableCell className="text-right py-1">{getCost(item).toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</TableCell>
                                                  <TableCell className="text-right py-1">
                                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.componentId)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                  </TableCell>
                                              </TableRow>
                                              ))
                                          ) : (
                                              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Adicione componentes da lista ao lado.</TableCell></TableRow>
                                          )}
                                      </TableBody>
                                  </Table>
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="prep-time">Tempo de Preparo (min)</Label>
                        <Input id="prep-time" type="number" value={preparationTime} onChange={e => setPreparationTime(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="labor-cost">Custo da Mão de Obra (R$/hora)</Label>
                        <Input id="labor-cost" type="number" value={laborCost} onChange={e => setLaborCost(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fixed-cost">Custos Fixos / Admin. (R$)</Label>
                        <Input id="fixed-cost" type="number" value={fixedCost} onChange={e => setFixedCost(parseFloat(e.target.value) || 0)} />
                    </div>
                </div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Transparência de Custo</CardTitle>
                    <CardDescription>Como o custo final está sendo formado.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="sm:col-span-2">
                      <Alert>
                        <AlertDescription>
                          Esta tela calcula custo e margem. Nao cria entrada no caixa ate a venda acontecer.
                        </AlertDescription>
                      </Alert>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-muted-foreground">Materiais</p>
                      <p className="font-semibold">
                        {materialCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-muted-foreground">Mão de obra</p>
                      <p className="font-semibold">
                        {totalLaborCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-muted-foreground">Custos fixos / admin</p>
                      <p className="font-semibold">
                        {fixedCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-muted-foreground">Custo final</p>
                      <p className="font-bold">
                        {totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
            </div>
            
            <div className="flex flex-col items-stretch gap-6 pt-6 border-t mt-auto bg-background">
                 <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="flex flex-col gap-2"><Label>Custo Final</Label><p className="font-bold text-lg">{totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</p></div>
                    <div className="flex flex-col gap-2">
                        <Label className="flex items-center gap-2">Modo de Preço</Label>
                        <div className="flex rounded-md border p-1">
                          <Button
                            type="button"
                            variant={pricingMode === "markup" ? "default" : "ghost"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setPricingMode("markup")}
                          >
                            Por Markup
                          </Button>
                          <Button
                            type="button"
                            variant={pricingMode === "price" ? "default" : "ghost"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setPricingMode("price")}
                          >
                            Por Preço
                          </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={pricingMode === "markup" ? "markup" : "manual-price"} className="flex items-center gap-1.5">
                            {pricingMode === "markup" ? "Markup (%)" : "Preço de Venda (R$)"}
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground"/></TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {pricingMode === "markup"
                                      ? "Defina o percentual sobre o custo."
                                      : "Defina o preço final e veja margem/markup automáticos."}
                                  </p>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        </Label>
                        {pricingMode === "markup" ? (
                          <Input
                            id="markup"
                            type="number"
                            value={markup}
                            onChange={e => setMarkup(parseFloat(e.target.value) || 0)}
                            placeholder="150"
                          />
                        ) : (
                          <Input
                            id="manual-price"
                            type="number"
                            value={manualPriceInput}
                            onChange={e => setManualPriceInput(e.target.value)}
                            placeholder="25.00"
                          />
                        )}
                    </div>
                    <div className="flex flex-col gap-2"><Label>Lucro Previsto</Label><p className="font-bold text-lg text-emerald-600">{isFinite(profit) ? profit.toLocaleString("pt-BR", { style: "currency", currency: "BRL"}) : "---"}</p></div>
                    <div className="flex flex-col gap-2">
                         <Label className="flex items-center gap-1.5">
                            Margem Final (%)
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground"/></TooltipTrigger>
                                <TooltipContent><p>Percentual de lucro sobre o PREÇO DE VENDA.</p></TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <p className="font-bold text-lg text-blue-600">{isFinite(finalMargin) ? finalMargin.toFixed(2) + '%' : "---"}</p>
                        <p className="text-xs text-muted-foreground">
                          Markup equivalente: {isFinite(impliedMarkup) ? impliedMarkup.toFixed(2) : "0.00"}%
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Preço de Venda</Label>
                      <p className="font-headline text-2xl font-bold text-primary">
                        {isFinite(suggestedPrice) ? suggestedPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL"}) : "Inválido"}
                      </p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <Button className="w-full sm:w-auto" onClick={handleSaveProduct} disabled={isProcessing}>
                        {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {product ? 'Salvar Alterações' : 'Salvar Produto'}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}

