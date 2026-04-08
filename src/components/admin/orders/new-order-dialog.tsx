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
import { PlusCircle, Trash2, Search, Loader, Minus } from 'lucide-react';
import { addOrder } from '@/services';
import type { Product, OrderItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

type NewOrderDialogProps = {
  products: Product[];
  user: any;
  firestore: any;
  tenantId?: string;
};

type WizardStep = 1 | 2 | 3;

export function NewOrderDialog({ products, user, firestore, tenantId }: NewOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
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
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
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
      setNewOrderItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
    } else {
      setNewOrderItems((prevItems) =>
        prevItems.map((item) => (item.productId === productId ? { ...item, quantity } : item))
      );
    }
  };

  const incrementQuantity = (productId: string) => {
    const item = newOrderItems.find((entry) => entry.productId === productId);
    if (!item) return;
    updateQuantity(productId, item.quantity + 1);
  };

  const decrementQuantity = (productId: string) => {
    const item = newOrderItems.find((entry) => entry.productId === productId);
    if (!item) return;
    updateQuantity(productId, item.quantity - 1);
  };

  const newOrderTotal = useMemo(() => {
    return newOrderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [newOrderItems]);

  const resetAndClose = () => {
    setStep(1);
    setNewOrderItems([]);
    setCustomerName('');
    setPaymentMethod('Dinheiro');
    setSearchTerm('');
    setIsProcessingOrder(false);
    setIsOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStep(1);
    }
  };

  const canGoNext = useMemo(() => {
    if (step === 1) return newOrderItems.length > 0;
    if (step === 2) return customerName.trim().length > 0;
    return true;
  }, [step, newOrderItems.length, customerName]);

  const goToNextStep = () => {
    if (!canGoNext) return;
    if (step === 1) setStep(2);
    if (step === 2) setStep(3);
  };

  const goToPreviousStep = () => {
    if (step === 3) setStep(2);
    if (step === 2) setStep(1);
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
        title: 'Cliente nao identificado',
        description: 'Preencha o nome do cliente.',
      });
      return;
    }

    setIsProcessingOrder(true);
    try {
      await addOrder(firestore, {
        userId: user.uid,
        tenantId,
        customerName,
        paymentMethod,
        total: newOrderTotal,
        items: newOrderItems,
      });

      toast({
        title: 'Pedido criado',
        description: `Venda para ${customerName} registrada com sucesso.`,
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
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button className="tap-target">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[92dvh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>Criar Novo Pedido</DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-2 py-2">
            {[
              { id: 1, label: 'Itens' },
              { id: 2, label: 'Cliente' },
              { id: 3, label: 'Confirmar' },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-6 w-6 rounded-full text-xs font-semibold flex items-center justify-center border',
                    step >= item.id ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.id}
                </div>
                <span className={cn('text-sm', step >= item.id ? 'font-medium' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-4 sm:px-6">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-4">
              <div className="flex flex-col gap-4">
                <Label>Itens do Pedido</Label>
                <ScrollArea className="h-64 border rounded-md p-2">
                  {newOrderItems.length > 0 ? (
                    newOrderItems.map((item) => (
                      <div key={item.productId} className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 tap-target"
                            onClick={() => decrementQuantity(item.productId)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.productId, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-14 h-9 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 tap-target"
                            onClick={() => incrementQuantity(item.productId)}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="flex-1 truncate text-sm">{item.productName}</span>
                        <span className="text-sm font-medium">
                          {(item.price * item.quantity).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 tap-target"
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
                          <td className="p-3">{product.name}</td>
                          <td className="p-3 text-right">
                            <PlusCircle className="h-4 w-4 text-muted-foreground inline-block" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                <Label htmlFor="payment-method">Metodo de Pagamento</Label>
                <Select
                  name="payment-method"
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger id="payment-method" className="tap-target">
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
          )}

          {step === 3 && (
            <div className="py-4 space-y-4">
              <Alert>
                <AlertDescription>
                  Ao finalizar, o pedido registra <strong>entrada no caixa</strong>, lanÃ§a o <strong>custo do produto vendido</strong> e reduz estoque dos itens.
                </AlertDescription>
              </Alert>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{customerName}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Pagamento</p>
                <p className="font-medium">{paymentMethod}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Itens ({newOrderItems.length})</p>
                <div className="mt-2 space-y-2">
                  {newOrderItems.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <span className="truncate pr-2">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">
                        {(item.price * item.quantity).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">
                    {newOrderTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6 flex-col sm:flex-row">
          <DialogClose asChild>
            <Button className="w-full sm:w-auto tap-target" variant="outline" disabled={isProcessingOrder}>
              Cancelar
            </Button>
          </DialogClose>

          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto tap-target"
              onClick={goToPreviousStep}
              disabled={isProcessingOrder}
            >
              Voltar
            </Button>
          )}

          {step < 3 && (
            <Button
              type="button"
              className="w-full sm:w-auto tap-target"
              onClick={goToNextStep}
              disabled={!canGoNext || isProcessingOrder}
            >
              Proximo
            </Button>
          )}

          {step === 3 && (
            <Button
              className="w-full sm:w-auto tap-target"
              onClick={handleCreateOrder}
              disabled={newOrderItems.length === 0 || isProcessingOrder}
            >
              {isProcessingOrder && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessingOrder ? 'Finalizando...' : 'Finalizar Pedido'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
