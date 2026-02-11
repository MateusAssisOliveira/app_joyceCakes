
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Pencil, Loader } from "lucide-react";
import { updateOrderStatus } from "@/services";
import type { Order, OrderStatus, Product } from "@/types";
import { OrderReceipt } from "@/components/admin/order-receipt";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, orderBy, onSnapshot, FirestoreError } from "firebase/firestore";
import { NewOrderDialog } from "@/components/admin/orders/new-order-dialog";

const getStatusVariant = (status: OrderStatus) => {
  switch (status) {
    case "Pendente": return "default";
    case "Em Preparo": return "secondary";
    case "Pronto para Retirada": return "default";
    case "Entregue": return "default";
    case "Cancelado": return "destructive";
    default: return "outline";
  }
};

type PointOfSaleClientProps = {
  products: Product[];
}

export function PointOfSaleClient({ products }: PointOfSaleClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  
  const firestore = useFirestore();
  const { user } = useUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [areOrdersLoading, setAreOrdersLoading] = useState(true);

  // Busca os pedidos em tempo real do Firestore
  useEffect(() => {
    if (!firestore) return;

    setAreOrdersLoading(true);
    const ordersQuery = query(collection(firestore, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Garante que createdAt seja um objeto Date
          createdAt: (data.createdAt as any).toDate ? (data.createdAt as any).toDate() : new Date(),
        } as Order;
      });
      setOrders(fetchedOrders);
      setAreOrdersLoading(false);
    }, (serverError: FirestoreError) => {
      // Cria e emite o erro contextual
      const permissionError = new FirestorePermissionError({
          path: 'orders',
          operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setAreOrdersLoading(false);
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar o componente

  }, [firestore]);


  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (!firestore) return;
    try {
        updateOrderStatus(firestore, orderId, newStatus);
        toast({ title: "Status Atualizado!", description: `O status do pedido ${orderId} foi alterado.` });
    } catch(e: any) {
        toast({ variant: "destructive", title: "Erro", description: e.message });
    }
  };
  
  const handlePrint = () => window.print();
  
  const getEditOrderUrl = (order: Order) => `/admin/orders/edit?id=${encodeURIComponent(order.id)}`;

  const getOrderDate = (order: Order): Date => {
    const date = order.createdAt;
    if (date instanceof Date) {
      return date;
    }
    if (date && typeof (date as any).toDate === 'function') {
      return (date as any).toDate();
    }
    return new Date();
  };

  if (areOrdersLoading) {
      return (
        <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
                <p className="text-lg font-semibold">Carregando pedidos...</p>
            </div>
        </div>
      )
  }

  return (
    <>
        <Card className="w-full flex-1 flex flex-col">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Pedidos Recebidos</CardTitle>
                    <CardDescription>
                        Visualize e gerencie os pedidos recebidos ou inicie uma nova venda.
                    </CardDescription>
                  </div>
                  <NewOrderDialog products={products || []} user={user} firestore={firestore} />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3 md:hidden">
                {orders?.map((order) => (
                  <div key={order.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.orderNumber} - {getOrderDate(order).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                    <div className="mt-3">
                      <Select
                        name={`status-mobile-${order.id}`}
                        value={order.status}
                        onValueChange={(value: OrderStatus) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger id={`status-mobile-trigger-${order.id}`} className="h-10 w-full">
                          <Badge
                            variant={getStatusVariant(order.status)}
                            className={cn(
                              "w-full justify-start border-none",
                              order.status === 'Em Preparo' && 'bg-amber-500 text-white hover:bg-amber-500/90',
                              order.status === 'Pendente' && 'bg-yellow-500 text-white hover:bg-yellow-500/90',
                              order.status === 'Pronto para Retirada' && 'bg-blue-500 text-white hover:bg-blue-500/90',
                              order.status === 'Entregue' && 'bg-emerald-500 text-white hover:bg-emerald-500/90',
                              order.status === 'Cancelado' && 'bg-red-500 text-white hover:bg-red-500/90'
                            )}
                          >
                            {order.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {['Pendente', 'Em Preparo', 'Pronto para Retirada', 'Entregue', 'Cancelado'].map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-10" asChild>
                        <Link href={getEditOrderUrl(order)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                      <Dialog
                        open={!!selectedOrder && selectedOrder.id === order.id}
                        onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-10"
                            title="Visualizar Detalhes"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        {selectedOrder && (
                          <DialogContent className="max-w-md print:hidden">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Pedido {selectedOrder.orderNumber}</DialogTitle>
                            </DialogHeader>
                            <OrderReceipt order={selectedOrder} />
                            <DialogFooter className="gap-2 sm:justify-end">
                              <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                              <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </div>
                  </div>
                ))}
                {orders?.length === 0 && (
                  <div className="h-24 rounded-lg border text-center text-sm text-muted-foreground flex items-center justify-center">
                    Nenhum pedido recebido ainda.
                  </div>
                )}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {orders?.map((order) => (
                      <TableRow key={order.id}>
                      <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.orderNumber} - {getOrderDate(order).toLocaleDateString("pt-BR")}</div>
                      </TableCell>
                      <TableCell>
                          {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}
                      </TableCell>
                      <TableCell>
                          <div className="flex justify-center">
                          <Select name={`status-${order.id}`} value={order.status} onValueChange={(value: OrderStatus) => handleStatusChange(order.id, value)} >
                              <SelectTrigger id={`status-trigger-${order.id}`} className="w-44 h-9">
                              <Badge variant={getStatusVariant(order.status)} className={cn("w-full justify-start border-none",
                                  order.status === 'Em Preparo' && 'bg-amber-500 text-white hover:bg-amber-500/90',
                                  order.status === 'Pendente' && 'bg-yellow-500 text-white hover:bg-yellow-500/90',
                                  order.status === 'Pronto para Retirada' && 'bg-blue-500 text-white hover:bg-blue-500/90',
                                  order.status === 'Entregue' && 'bg-emerald-500 text-white hover:bg-emerald-500/90',
                                  order.status === 'Cancelado' && 'bg-red-500 text-white hover:bg-red-500/90')}>
                                  {order.status}
                              </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                  {['Pendente', 'Em Preparo', 'Pronto para Retirada', 'Entregue', 'Cancelado'].map((status) => (
                                      <SelectItem key={status} value={status}>{status}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" title="Editar Pedido" asChild>
                              <Link href={getEditOrderUrl(order)}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                          <Dialog open={!!selectedOrder && selectedOrder.id === order.id} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
                              <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" title="Visualizar Detalhes" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                  </Button>
                              </DialogTrigger>
                              {selectedOrder && (
                                  <DialogContent className="max-w-md print:hidden">
                                  <DialogHeader>
                                      <DialogTitle>Detalhes do Pedido {selectedOrder.orderNumber}</DialogTitle>
                                  </DialogHeader>
                                  <OrderReceipt order={selectedOrder} />
                                  <DialogFooter className="gap-2 sm:justify-end">
                                      <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                                      <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
                                  </DialogFooter>
                                  </DialogContent>
                              )}
                          </Dialog>
                      </TableCell>
                      </TableRow>
                  ))}
                   {orders?.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                              Nenhum pedido recebido ainda.
                          </TableCell>
                      </TableRow>
                  )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
        </Card>
      
      {/* Hidden printable component */}
      {selectedOrder && <OrderReceipt order={selectedOrder} className="hidden print:block" />}
    </>
  );
}
