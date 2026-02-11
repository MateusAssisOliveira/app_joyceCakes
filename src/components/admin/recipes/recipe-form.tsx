

"use client";

import { useState, useMemo, useEffect } from "react";
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
import { PlusCircle, Trash2, Search, BookMarked, Loader, ChevronLeft, ChevronRight } from "lucide-react";
import { addTechnicalSheet } from "@/services";
import type { Supply, TechnicalSheet, TechnicalSheetComponent } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore } from "@/firebase";

type RecipeFormProps = {
  supplies: Supply[];
  savedSheets: TechnicalSheet[];
  onSaveSuccess: () => void;
};

const ITEMS_PER_PAGE = 10;

export function RecipeForm({ supplies, savedSheets, onSaveSuccess }: RecipeFormProps) {
  const [components, setComponents] = useState<TechnicalSheetComponent[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [sheetYield, setSheetYield] = useState("");
  const [lossFactor, setLossFactor] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const firestore = useFirestore();

  const filteredSupplies = useMemo(() => {
    return supplies.filter((supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase()) && supply.type !== 'packaging'
    );
  }, [supplies, searchTerm]);

  const totalPages = Math.ceil(filteredSupplies.length / ITEMS_PER_PAGE);

  const paginatedSupplies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSupplies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSupplies, currentPage]);

  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm]);
  
  const addComponent = (item: Supply) => {
    if (components.find((c) => c.componentId === item.id)) return;
    
    let unit = 'un';
    if (item.unit === 'kg') unit = 'g';
    else if (item.unit === 'L') unit = 'ml';
    else unit = item.unit;

    const newComponent: TechnicalSheetComponent = {
      componentId: item.id,
      componentName: item.name,
      componentType: 'supply',
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

  const getCost = (component: TechnicalSheetComponent) => {
    let rawCost = 0;
    const supply = supplies.find(s => s.id === component.componentId);
    if (!supply) return 0;
    
    let costPerBaseUnit = supply.costPerUnit;
    if (supply.unit === 'kg' || supply.unit === 'L') {
        costPerBaseUnit /= 1000;
    }
    rawCost = component.quantity * costPerBaseUnit;

    return rawCost;
  };

  const totalCost = useMemo(() => {
    const subTotal = components.reduce((total, item) => total + getCost(item), 0);
    return subTotal * (1 + (lossFactor || 0) / 100);
  }, [components, supplies, lossFactor]);

  const clearForm = () => {
      setComponents([]);
      setSheetName("");
      setDescription("");
      setSteps("");
      setSheetYield("");
      setLossFactor(0);
  }

  const handleSaveSheet = async () => {
    if (!firestore) return;
    if (!sheetName.trim()) {
        toast({ variant: "destructive", title: "Nome da Receita Inválido" });
        return;
    }
    if (components.length === 0) {
        toast({ variant: "destructive", title: "Receita Vazia", description: "Adicione ingredientes à receita." });
        return;
    }

    setIsProcessing(true);
    try {
      const sheetData: Omit<TechnicalSheet, "id" | "createdAt" | "isActive"> = {
        name: sheetName,
        description,
        type: 'base',
        components,
        steps,
        yield: sheetYield,
        lossFactor: lossFactor,
        totalCost,
        suggestedPrice: 0,
      };

      await addTechnicalSheet(firestore, sheetData);
      
      toast({
        title: "Receita Salva!",
        description: `A receita "${sheetName}" foi salva no seu livro.`,
      });
      clearForm();
      onSaveSuccess();
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erro ao Salvar Receita", description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start h-full">
        <div className="lg:col-span-1 h-full">
          <Card className="lg:sticky lg:top-24 flex flex-col">
            <CardHeader>
              <CardTitle>Ingredientes Disponíveis</CardTitle>
              <div className="relative pt-2">
                <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="component-search"
                  name="component-search"
                  placeholder="Buscar ingrediente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ScrollArea className="h-[20rem] sm:h-[35rem]">
                <div className="space-y-2 md:hidden">
                  {paginatedSupplies.map((supply) => (
                    <div key={supply.id} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{supply.name}</span>
                      <Button size="sm" variant="outline" onClick={() => addComponent(supply)} disabled={components.some(c => c.componentId === supply.id)}>
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                  {paginatedSupplies.length === 0 && (
                    <div className="h-24 rounded-md border text-center text-sm text-muted-foreground flex items-center justify-center">
                      Nenhum ingrediente encontrado.
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableBody>
                      {paginatedSupplies.map((supply) => (
                        <TableRow key={supply.id} className="cursor-pointer" onClick={() => addComponent(supply)}>
                          <TableCell className="py-2">{supply.name}</TableCell>
                          <TableCell className="text-right py-2">
                            <Button size="icon" variant="ghost" disabled={components.some(c => c.componentId === supply.id)}>
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                       {paginatedSupplies.length === 0 && (
                          <TableRow><TableCell colSpan={2} className="text-center h-24">Nenhum ingrediente encontrado.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
             <CardFooter className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                    Página {totalPages > 0 ? currentPage : 0} de {totalPages}
                </span>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nova Receita (Ficha de Base)</CardTitle>
              <CardDescription>Preencha os detalhes da sua nova receita, que poderá ser usada na montagem de produtos finais.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
               <div className="grid gap-2">
                  <Label htmlFor="sheet-name">Nome da Receita</Label>
                  <Input id="sheet-name" name="sheet-name" placeholder="Ex: Massa de Chocolate, Recheio de Brigadeiro" value={sheetName} onChange={(e) => setSheetName(e.target.value)} />
                </div>
               <div className="grid gap-2">
                <Label htmlFor="sheet-description">Breve Descrição</Label>
                <Textarea id="sheet-description" name="sheet-description" placeholder="Uma dica ou detalhe especial sobre a receita." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <Label>Ingredientes da Receita</Label>
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
                                <div className="h-24 rounded-md border text-center text-sm text-muted-foreground flex items-center justify-center">Adicione ingredientes da lista acima.</div>
                              )}
                             </div>
                             <div className="hidden md:block">
                              <Table>
                                  <TableHeader>
                                  <TableRow>
                                      <TableHead className="w-3/5">Ingrediente</TableHead>
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
                                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Adicione ingredientes da lista ao lado.</TableCell></TableRow>
                                  )}
                                  </TableBody>
                              </Table>
                             </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
              </div>
               <div className="grid gap-2">
                <Label htmlFor="sheet-steps">Modo de Preparo</Label>
                <Textarea id="sheet-steps" name="sheet-steps" placeholder="Passo 1: Misture os ingredientes secos..." value={steps} onChange={(e) => setSteps(e.target.value)} rows={5}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="sheet-yield">Rendimento Final da Receita</Label>
                      <Input id="sheet-yield" name="sheet-yield" placeholder="Ex: 1200g, 1000ml" value={sheetYield} onChange={e => setSheetYield(e.target.value)}/>
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="loss-factor">Fator de Perda da Receita (%)</Label>
                      <Input id="loss-factor" name="loss-factor" type="number" placeholder="Ex: 5" value={lossFactor} onChange={e => setLossFactor(parseFloat(e.target.value) || 0)}/>
                  </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-6 !p-6 border-t mt-4">
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2"><Label>Custo Total da Receita</Label><p className="font-bold text-lg">{totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</p></div>
                </div>
                 <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                     <Button className="w-full sm:w-auto" variant="outline" onClick={clearForm} disabled={isProcessing}>Limpar Formulário</Button>
                     <Button className="w-full sm:w-auto" onClick={handleSaveSheet} disabled={isProcessing}>
                        {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        {isProcessing ? 'Salvando...' : <><BookMarked className="mr-2 h-4 w-4"/>Salvar Receita</>}
                    </Button>
                 </div>
            </CardFooter>
          </Card>
        </div>
      </div>
  );
}
