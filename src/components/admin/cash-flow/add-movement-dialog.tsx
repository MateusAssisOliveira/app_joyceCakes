'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader, PlusCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addFinancialMovement } from '@/services';
import type { CashRegister, Product } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type AddMovementDialogProps = {
  cashRegister: CashRegister;
  products: Product[];
};

const incomeCategories = ["Venda de Produto", "Aporte"];
const expenseCategories = ["Compra de Insumos", "Custo de Produto Vendido", "Despesa Fixa", "Retirada/Pró-labore", "Outras Despesas"];

export function AddMovementDialog({ cashRegister, products }: AddMovementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState(incomeCategories[0]);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);

  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (type === 'income') {
      setCategory(incomeCategories[0]);
    } else {
      setCategory(expenseCategories[0]);
      setDescription('');
      setAmount(0);
    }
  }, [type]);

  const resetForm = () => {
    setAmount(0);
    setDescription('');
    setCategory(incomeCategories[0]);
    setPaymentMethod('Dinheiro');
    setType('income');
  };

  const handleAddMovement = async () => {
    if (!firestore) return;
    if (amount <= 0 || !description || !category) {
      toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Preencha valor, descrição e categoria.' });
      return;
    }

    setIsProcessing(true);
    try {
      await addFinancialMovement(firestore, cashRegister, {
        type,
        amount,
        description,
        category,
        paymentMethod,
      });
      toast({ title: 'Movimentação Registrada!', description: `${type === 'income' ? 'Entrada' : 'Saída'} de ${amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} registrada com sucesso.` });
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Registrar', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setDescription(product.name);
    setAmount(product.price);
    setIsProductPopoverOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Nova Movimentação</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
        </DialogHeader>
        <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full pt-4">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="income">Entrada</TabsTrigger>
            <TabsTrigger value="expense">Saída</TabsTrigger>
          </TabsList>
          
          <div className="grid gap-4 py-4">
             {type === 'income' && (
              <div className="grid gap-2">
                <Label htmlFor="product-search">Buscar Produto (Opcional)</Label>
                <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isProductPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      Selecione um produto...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar produto..." />
                      <CommandList>
                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        <CommandGroup>
                          {products.map((product) => (
                            <CommandItem
                              key={product.id}
                              onSelect={() => handleProductSelect(product)}
                            >
                              {product.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="amount">Valor</Label>
                    <Input id="amount" name="amount" type="number" placeholder="R$ 0,00" value={amount || ''} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} autoFocus />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="payment-method">Método</Label>
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
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" placeholder={type === 'income' ? 'Ex: Venda de bolo no balcão' : 'Ex: Compra de embalagens'} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select name="category" value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </Tabs>
        <DialogFooter className="flex-col sm:flex-row">
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>Cancelar</Button>
          <Button className="w-full sm:w-auto" onClick={handleAddMovement} disabled={isProcessing}>
            {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Registrando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
