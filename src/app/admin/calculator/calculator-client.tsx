

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
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
import { PlusCircle, Trash2, Search, ShoppingCart, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { addOrder } from "@/services";
import type { Supply, OrderItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type RecipeItem = {
  supply: Supply;
  quantity: number;
};

type CalculatorClientProps = {
    supplies: Supply[];
};

const ITEMS_PER_PAGE = 10;

export function CalculatorClient({ supplies }: CalculatorClientProps) {
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [markup, setMarkup] = useState(150);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const filteredSupplies = useMemo(() => {
    return supplies.filter((supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const addSupplyToRecipe = (supply: Supply) => {
    if (recipeItems.find((item) => item.supply.id === supply.id)) return;
    setRecipeItems([...recipeItems, { supply, quantity: 0 }]);
  };

  const updateQuantity = (supplyId: string, quantity: number) => {
    setRecipeItems(
      recipeItems.map((item) =>
        item.supply.id === supplyId ? { ...item, quantity: quantity } : item
      )
    );
  };
  
  const removeItem = (supplyId: string) => {
    setRecipeItems(recipeItems.filter(item => item.supply.id !== supplyId));
  }

  const getCost = (item: RecipeItem) => {
    const { supply, quantity } = item;
    
    let costPerBaseUnit = supply.costPerUnit;

    if (supply.unit === 'kg' || supply.unit === 'L') {
        costPerBaseUnit /= 1000;
    }
    
    return quantity * costPerBaseUnit;
  };
  
  const getRecipeUnit = (supply: Supply) => {
    switch (supply.unit) {
      case 'kg': return 'g';
      case 'L': return 'ml';
      default: return 'un';
    }
  }

  const totalCost = useMemo(() => {
    return recipeItems.reduce((total, item) => total + getCost(item), 0);
  }, [recipeItems]);

  const suggestedPrice = useMemo(() => {
    return totalCost * (1 + markup / 100);
  }, [totalCost, markup]);
  
  const profit = useMemo(() => suggestedPrice - totalCost, [suggestedPrice, totalCost]);

  const finalMargin = useMemo(() => {
    if (suggestedPrice === 0) return 0;
    return (profit / suggestedPrice) * 100;
  }, [profit, suggestedPrice]);


  const handleSaveAsOrder = async () => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado. Por favor, recarregue a página." });
        return;
    }
    if (recipeItems.length === 0) {
        toast({ variant: "destructive", title: "Receita Vazia", description: "Adicione insumos para criar o pedido." });
        return;
    }

    const orderItems: OrderItem[] = recipeItems.map(item => {
        const itemCost = getCost(item);
        const itemPrice = itemCost * (1 + markup / 100);
        return {
            productId: item.supply.id,
            productName: item.supply.name,
            quantity: item.quantity,
            price: itemPrice,
            costPrice: itemCost,
        }
    });
    
    try {
        await addOrder(firestore, {
          userId: user.uid,
          customerName: "Pedido Personalizado",
          total: suggestedPrice,
          items: orderItems,
          paymentMethod: paymentMethod,
          allowUnknownProducts: true,
        });
        
        toast({
          title: "Pedido Criado!",
          description: "Um novo pedido personalizado foi criado e registrado no fluxo de caixa.",
        });
        router.push('/admin/orders');
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erro ao criar pedido", description: e.message });
    }
  };

  return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Insumos Disponíveis</CardTitle>
              <div className="relative pt-2">
                <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar insumo..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[20rem] sm:h-96">
                <div className="space-y-2 md:hidden">
                  {paginatedSupplies.map((supply) => (
                    <div key={supply.id} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{supply.name}</span>
                      <Button size="sm" variant="outline" onClick={() => addSupplyToRecipe(supply)} disabled={recipeItems.some(item => item.supply.id === supply.id)}>
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                  {paginatedSupplies.length === 0 && (
                    <div className="h-24 rounded-md border text-center text-sm text-muted-foreground flex items-center justify-center">
                      Nenhum insumo encontrado.
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableBody>
                      {paginatedSupplies.map((supply) => (
                        <TableRow key={supply.id} className="cursor-pointer" onClick={() => addSupplyToRecipe(supply)}>
                          <TableCell className="py-2">{supply.name}</TableCell>
                          <TableCell className="text-right py-2">
                            <Button size="icon" variant="ghost" disabled={recipeItems.some(item => item.supply.id === supply.id)}>
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedSupplies.length === 0 && (
                          <TableRow><TableCell colSpan={2} className="text-center h-24">Nenhum insumo encontrado.</TableCell></TableRow>
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
              <CardTitle>Montar Item Personalizado</CardTitle>
              <CardDescription>Adicione ingredientes para calcular o custo e o preço de venda.</CardDescription>
            </CardHeader>
            <CardContent>
                <Label>Ingredientes</Label>
                <Card className="mt-2">
                    <CardContent className="p-2">
                        <ScrollArea className="h-60">
                             <div className="space-y-2 md:hidden">
                              {recipeItems.length > 0 ? (
                                recipeItems.map((item) => (
                                  <div key={item.supply.id} className="rounded-md border p-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium text-sm">{item.supply.name}</p>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.supply.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                    <div className="mt-2 grid grid-cols-3 gap-2 items-end">
                                      <Input type="number" className="h-8" value={item.quantity} onChange={(e) => updateQuantity(item.supply.id, parseFloat(e.target.value) || 0)} min="0" />
                                      <span className="text-xs text-muted-foreground">{getRecipeUnit(item.supply)}</span>
                                      <span className="text-right text-sm">{getCost(item).toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="h-24 rounded-md border text-center text-sm text-muted-foreground flex items-center justify-center">Adicione insumos da lista ao lado.</div>
                              )}
                             </div>
                             <div className="hidden md:block">
                              <Table>
                                  <TableHeader>
                                  <TableRow>
                                      <TableHead className="w-2/5">Insumo</TableHead>
                                      <TableHead>Qtd.</TableHead>
                                      <TableHead>Un.</TableHead>
                                      <TableHead className="text-right">Custo</TableHead>
                                      <TableHead className="text-right">Ação</TableHead>
                                  </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                  {recipeItems.length > 0 ? (
                                      recipeItems.map((item) => (
                                      <TableRow key={item.supply.id}>
                                          <TableCell className="font-medium py-1">{item.supply.name}</TableCell>
                                          <TableCell className="py-1">
                                          <Input type="number" className="w-20 h-8" value={item.quantity} onChange={(e) => updateQuantity(item.supply.id, parseFloat(e.target.value) || 0)} min="0" />
                                          </TableCell>
                                          <TableCell className="text-xs text-muted-foreground py-1">{getRecipeUnit(item.supply)}</TableCell>
                                          <TableCell className="text-right py-1">{getCost(item).toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</TableCell>
                                          <TableCell className="text-right py-1">
                                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.supply.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                          </TableCell>
                                      </TableRow>
                                      ))
                                  ) : (
                                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Adicione insumos da lista ao lado.</TableCell></TableRow>
                                  )}
                                  </TableBody>
                              </Table>
                             </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-6 !p-6 border-t mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                      <Label htmlFor="payment-method">Método de Pagamento</Label>
                         <Select name="payment-method" value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger id="payment-method"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="PIX">PIX</SelectItem>
                                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                <SelectItem value="Transferência">Transferência</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                </div>
                 <div className="border-t pt-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 items-end gap-4">
                        <div className="flex flex-col gap-2"><Label>Custo Total</Label><p className="font-bold text-lg">{totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</p></div>
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
                        <div>
                            <Label className="text-sm">Preço Final de Venda</Label>
                            <p className="font-headline text-3xl font-bold text-primary">{isFinite(suggestedPrice) ? suggestedPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL"}) : "Inválido"}</p>
                        </div>
                     </div>
                 </div>
                 <div className="flex justify-end gap-2 mt-4">
                     <Button className="w-full sm:w-auto" onClick={handleSaveAsOrder} disabled={recipeItems.length === 0}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Salvar como Pedido Personalizado
                    </Button>
                 </div>
            </CardFooter>
          </Card>
        </div>
      </div>
  );
}
