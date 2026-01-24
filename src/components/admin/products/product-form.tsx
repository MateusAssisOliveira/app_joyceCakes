

"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ITEMS_PER_PAGE = 5;

type ProductFormProps = {
  product: Product | null;
  supplies: Supply[];
  baseSheets: TechnicalSheet[];
  onSaveSuccess: () => void;
};

export function ProductForm({ product, supplies, baseSheets, onSaveSuccess }: ProductFormProps) {
  const [components, setComponents] = useState<Omit<TechnicalSheetComponent, 'lossFactor'>[]>([]);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  
  const [markup, setMarkup] = useState(150);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preparationTime, setPreparationTime] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [fixedCost, setFixedCost] = useState(0);

  const [suppliesPage, setSuppliesPage] = useState(1);
  const [sheetsPage, setSheetsPage] = useState(1);

  const { toast } = useToast();
  const firestore = useFirestore();

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

    } else {
      setProductName("");
      setDescription("");
      setCategory("");
      setComponents([]);
      setPreparationTime(0);
      setLaborCost(0);
      setFixedCost(0);
      setMarkup(150);
    }
  }, [product]);

  // --- COMPONENT LIST LOGIC ---
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


  // --- FORM LOGIC ---
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

    } else {
        const sheet = baseSheets.find(s => s.id === component.componentId);
        if (!sheet || !sheet.yield) return 0;
        
        const yieldAmount = parseFloat(sheet.yield.replace(/[^0-9,.]/g, '').replace(',', '.'));
        if(isNaN(yieldAmount) || yieldAmount === 0) return 0;

        const costPerGramOfSheet = sheet.totalCost / yieldAmount;
        rawCost = component.quantity * costPerGramOfSheet;
    }
    return rawCost;
  };

  const materialCost = useMemo(() => {
    return components.reduce((total, item) => total + getCost(item), 0);
  }, [components, supplies, baseSheets]);

  const totalLaborCost = useMemo(() => {
    if (laborCost === 0 || preparationTime === 0) return 0;
    return (preparationTime / 60) * laborCost;
  }, [preparationTime, laborCost]);

  const totalCost = useMemo(() => materialCost + totalLaborCost + fixedCost, [materialCost, totalLaborCost, fixedCost]);

  const suggestedPrice = useMemo(() => {
    return totalCost * (1 + (markup / 100));
  }, [totalCost, markup]);
  
  const profit = useMemo(() => suggestedPrice - totalCost, [suggestedPrice, totalCost]);

  const finalMargin = useMemo(() => {
    if (suggestedPrice === 0) return 0;
    return (profit / suggestedPrice) * 100;
  }, [profit, suggestedPrice]);

  const handleSaveProduct = async () => {
    if (!firestore) return;
    if (!productName.trim()) {
        toast({ variant: "destructive", title: "Nome do Produto Inválido" });
        return;
    }
     if (markup < 0) {
        toast({ variant: "destructive", title: "Markup Inválido", description: "O markup não pode ser negativo." });
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
        await updateProduct(firestore, product.id, productData);
        toast({ title: "Produto Atualizado!", description: `"${productName}" foi atualizado.` });
      } else {
        await addProduct(firestore, productData);
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
                            <div className="flex items-center justify-end space-x-2 py-2">
                                <Button variant="outline" size="sm" onClick={() => setSuppliesPage(p => p - 1)} disabled={suppliesPage === 1}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
                                <Button variant="outline" size="sm" onClick={() => setSuppliesPage(p => p + 1)} disabled={suppliesPage >= totalSuppliesPages}>Próximo <ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-muted-foreground px-2 mt-4 block">RECEITAS (FICHAS DE BASE)</Label>
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
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto px-1 pr-4">
                <CardHeader className="p-0">
                    <CardTitle>Montagem do Produto</CardTitle>
                    <CardDescription>Defina os detalhes, adicione componentes e calcule o preço do seu produto final.</CardDescription>
                </CardHeader>
                
                <div className="grid grid-cols-2 gap-4">
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
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid grid-cols-3 gap-4">
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
            </div>
            
            <div className="flex flex-col items-stretch gap-6 pt-6 border-t mt-auto bg-background">
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="flex flex-col gap-2"><Label>Custo Final</Label><p className="font-bold text-lg">{totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</p></div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="markup" className="flex items-center gap-1.5">
                            Markup (%)
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground"/></TooltipTrigger>
                                <TooltipContent><p>Margem de lucro sobre o CUSTO.</p></TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Input id="markup" type="number" value={markup} onChange={e => setMarkup(parseFloat(e.target.value) || 0)} placeholder="150"/>
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
                    </div>
                    <div className="flex flex-col gap-2"><Label>Preço de Venda</Label><p className="font-headline text-2xl font-bold text-primary">{isFinite(suggestedPrice) ? suggestedPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL"}) : "Inválido"}</p></div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <Button onClick={handleSaveProduct} disabled={isProcessing}>
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
