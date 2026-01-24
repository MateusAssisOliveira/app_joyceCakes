
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
import { PlusCircle, Trash2, Search, ShoppingCart } from "lucide-react";
import { addOrder } from "@/services";
import type { Supply, OrderItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useAuth } from "@/firebase";

type RecipeItem = {
  supply: Supply;
  quantity: number;
};

type CalculatorClientProps = {
    supplies: Supply[];
};

export function CalculatorClient({ supplies }: CalculatorClientProps) {
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [markup, setMarkup] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const filteredSupplies = useMemo(() => {
    return supplies.filter((supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplies, searchTerm]);

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

    // Se a unidade de compra for kg ou L, converte o custo para g ou ml
    if (supply.unit === 'kg' || supply.unit === 'L') {
        costPerBaseUnit /= 1000;
    }
    // Se for g, ml ou un, o costPerUnit já está na base correta
    
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
  
  const handleSaveAsOrder = () => {
    if (!firestore) return;
    if (recipeItems.length === 0) {
        toast({ variant: "destructive", title: "Receita Vazia", description: "Adicione insumos para criar o pedido." });
        return;
    }

    const orderItems: OrderItem[] = recipeItems.map(item => ({
      productId: item.supply.id, // Using supply id as product id for custom orders
      productName: item.supply.name,
      quantity: item.quantity,
      price: getCost(item) * (1 + markup/100), // Calculating price for this single item
    }));
    
    addOrder(firestore, {
      customerName: "Pedido Personalizado",
      total: suggestedPrice,
      items: orderItems,
    });
    
    toast({
      title: "Pedido Criado!",
      description: "Um novo pedido personalizado foi criado com base na sua receita.",
    });
    router.push('/admin/orders');
  };

  return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
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
              <ScrollArea className="h-96">
                <Table>
                  <TableBody>
                    {filteredSupplies.map((supply) => (
                      <TableRow key={supply.id} className="cursor-pointer" onClick={() => addSupplyToRecipe(supply)}>
                        <TableCell className="py-2">{supply.name}</TableCell>
                        <TableCell className="text-right py-2">
                          <Button size="icon" variant="ghost" disabled={recipeItems.some(item => item.supply.id === supply.id)}>
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
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
                        </ScrollArea>
                    </CardContent>
                </Card>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-6 !p-6 border-t mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2"><Label>Custo Total</Label><p className="font-bold text-lg">{totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</p></div>
                    <div className="flex flex-col gap-2"><Label htmlFor="markup">Margem de Lucro (%)</Label><Input id="markup" type="number" value={markup} onChange={e => setMarkup(parseFloat(e.target.value) || 0)} placeholder="100"/></div>
                </div>
                 <div className="border-t pt-4">
                    <Label className="text-sm">Preço Final de Venda Sugerido</Label>
                    <p className="font-headline text-3xl font-bold text-primary">{suggestedPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</p>
                 </div>
                 <div className="flex justify-end gap-2 mt-4">
                     <Button onClick={handleSaveAsOrder} disabled={recipeItems.length === 0}>
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
