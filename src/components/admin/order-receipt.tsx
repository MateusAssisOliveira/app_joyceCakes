// COMPONENTE DE RECIBO DE PEDIDO
//
// Propósito:
// Este componente renderiza um recibo detalhado para um pedido específico.
// É usado tanto para visualização em um diálogo quanto para impressão.
//
// Responsabilidade:
// - Receber os dados de um `order` como prop.
// - Formatar e exibir todas as informações do pedido: ID, cliente, data,
//   lista de itens com quantidades e subtotais, e o valor total.
// - Ter uma estrutura de HTML e CSS que seja amigável para impressão.

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { CakeSlice } from "lucide-react";

interface OrderReceiptProps {
  order: Order;
  className?: string;
}

export function OrderReceipt({ order, className }: OrderReceiptProps) {
  
  const getOrderDate = (order: Order): Date => {
    const date = order.createdAt || order.date;
    if (!date) {
        return new Date(); // fallback
    }
    // O hook já deve ter convertido para Date
    if (date instanceof Date) {
      return date;
    }
    // Fallback para Timestamps, se houver dados antigos
    if (typeof (date as any).toDate === 'function') {
      return (date as any).toDate();
    }
    // Fallback para string ISO
    if (typeof date === 'string') {
        return new Date(date);
    }
    return new Date();
  }

  return (
    <div className={cn("p-4 border rounded-lg bg-background", className)}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <CakeSlice className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl font-bold">Doce Caixa</span>
            </div>
            <div className="text-right">
                <h2 className="text-lg font-bold">Recibo do Pedido</h2>
                <p className="text-sm text-muted-foreground">{order.orderNumber || order.id}</p>
            </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="font-semibold">Cliente:</p>
                <p>{order.customerName}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold">Data do Pedido:</p>
                <p>{getOrderDate(order).toLocaleString("pt-BR")}</p>
            </div>
        </div>

        <Separator className="my-4" />

        <h3 className="font-semibold mb-2 text-sm">Itens do Pedido:</h3>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="h-8">Produto</TableHead>
                    <TableHead className="h-8 text-center">Qtd.</TableHead>
                    <TableHead className="h-8 text-right">Subtotal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {order.items.map(item => (
                    <TableRow key={item.productId}>
                        <TableCell className="py-2">{item.productName}</TableCell>
                        <TableCell className="py-2 text-center">{item.quantity}</TableCell>
                        <TableCell className="py-2 text-right">{(item.price * item.quantity).toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold text-base">Total</TableCell>
                    <TableCell className="text-right font-bold text-base">{order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL"})}</TableCell>
                </TableRow>
            </TableFooter>
        </Table>

        <Separator className="my-4" />

        <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Obrigado pela sua preferência!</p>
            <p>www.docecaixa.com</p>
        </div>
    </div>
  );
}
