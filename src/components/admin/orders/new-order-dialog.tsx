'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Search, Loader } from 'lucide-react';
import { addOrder } from '@/services';
import type { Product, OrderItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type NewOrderDialogProps = {
  products: Product[];
  user: any;
  firestore: any;
};

export function NewOrderDialog({ products, user, firestore }: NewOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.isActive !== false
    );
  }, [products, searchTerm]);

  const addProductToOrder = (product: Product) => {
    setNewOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          costPrice: product.costPrice,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setNewOrderItems((prevItems) =>
        prevItems.filter((item) => item.productId !== productId)
      );
    } else {
      setNewOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const newOrderTotal = useMemo(() => {
    return newOrderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [newOrderItems]);

  const resetAndClose = () => {
    setNewOrderItems([]);
    setCustomerName('');
    setPaymentMethod('Dinheiro');
    setSearchTerm('');
    setIsProcessingOrder(false);
    setIsOpen(false);
  };

  const handleCreateOrder = async () => {
    if (!firestore || !user) return;
    if (newOrderItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Pedido vazio',
        description: 'Adicione produtos para criar um pedido.',
      });
      return;
    }
    if (!customerName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cliente não identificado',
        description: 'Por favor, insira o nome do cliente.',
      });
      return;
    }

    setIsProcessingOrder(true);
    try {
      await addOrder(firestore, {
        userId: user.uid,
        customerName: customerName,
        paymentMethod: paymentMethod,
        total: newOrderTotal,
        items: newOrderItems,
      });

      toast({
        title: 'Pedido Criado!',
        description: `A venda para ${customerName} foi criada e registrada no fluxo de caixa.`,
      });
      resetAndClose();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar pedido',
        description: e.message,
      });
      setIsProcessingOrder(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-5xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Pedido</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Coluna da Esquerda: Itens do Pedido */}
          <div className="flex flex-col gap-4">
            <Label>Itens do Pedido</Label>
            <ScrollArea className="h-64 border rounded-md p-2">
              {newOrderItems.length > 0 ? (
                newOrderItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 mb-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.productId, parseInt(e.target.value) || 0)
                      }
                      className="w-16 h-10"
                    />
                    <span className="flex-1 truncate text-sm">{item.productName}</span>
                    <span className="text-sm font-medium">
                      {(item.price * item.quantity).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => updateQuantity(item.productId, 0)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground py-16">
                  Adicione produtos da lista ao lado.
                </p>
              )}
            </ScrollArea>
            <div className="flex justify-between items-center font-bold text-lg border-t pt-4">
              <span>Total</span>
              <span>
                {newOrderTotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
          {/* Coluna da Direita: Busca de Produtos */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-order-product-search">Buscar Produtos</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-order-product-search"
                  name="new-order-product-search"
                  placeholder="Buscar produto..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-64 border rounded-md">
              <table className="w-full">
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => addProductToOrder(product)}
                      className="cursor-pointer hover:bg-muted"
                    >
                      <td className="p-2">{product.name}</td>
                      <td className="p-2 text-right">
                        <PlusCircle className="h-4 w-4 text-muted-foreground inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Nome do Cliente</Label>
            <Input
              id="customer-name"
              name="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-method">Método de Pagamento</Label>
            <Select
              name="payment-method"
              value={paymentMethod}
              onValueChange={setPaymentMethod}
            >
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
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
        <DialogFooter className="pt-6 flex-col sm:flex-row">
          <DialogClose asChild>
            <Button className="w-full sm:w-auto" variant="outline" disabled={isProcessingOrder}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            className="w-full sm:w-auto"
            onClick={handleCreateOrder}
            disabled={newOrderItems.length === 0 || isProcessingOrder}
          >
            {isProcessingOrder && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessingOrder ? 'Finalizando...' : 'Finalizar Pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
