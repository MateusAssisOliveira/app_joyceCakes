"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Order, OrderItem, Product } from "@/types";
import { useFirestore } from "@/firebase";
import { updateOrder } from "@/services";
import { useToast } from "@/hooks/use-toast";

type EditOrderClientProps = {
  order: Order | null;
  products: Product[];
};

export function EditOrderClient({ order, products }: EditOrderClientProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [items, setItems] = useState<OrderItem[]>(() => order?.items ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 0);
      }, 0),
    [items]
  );

  if (!order) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <p className="text-lg font-semibold">Pedido não encontrado</p>
        <p className="text-sm text-muted-foreground">
          Verifique se o link do pedido está correto ou volte para a lista de
          pedidos.
        </p>
      </div>
    );
  }

  const handleChangeProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setItems((prev) => {
      const next = [...prev];
      const current = next[index];
      const quantity = current?.quantity ?? 1;

      next[index] = {
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        costPrice: product.costPrice,
      };

      return next;
    });
  };

  const handleChangeQuantity = (index: number, value: string) => {
    const quantity = Math.max(1, Number(value) || 1);
    setItems((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        quantity,
      };
      return next;
    });
  };

  const handleAddItem = () => {
    const firstProduct = products[0];
    if (!firstProduct) {
      toast({
        variant: "destructive",
        title: "Nenhum produto cadastrado",
        description:
          "Cadastre ao menos um produto antes de adicionar itens ao pedido.",
      });
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: firstProduct.id,
        productName: firstProduct.name,
        quantity: 1,
        price: firstProduct.price,
        costPrice: firstProduct.costPrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Conexão com o banco de dados não encontrada.",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Pedido sem itens",
        description:
          "Adicione pelo menos um item ao pedido antes de salvar as alterações.",
      });
      return;
    }

    setIsSaving(true);

    try {
      updateOrder(firestore, order.id, {
        items,
        total,
      });

      toast({
        title: "Pedido atualizado",
        description: "Os itens do pedido foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar pedido",
        description: error?.message ?? "Tente novamente em instantes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full flex-1 flex flex-col">
      <CardHeader>
        <CardTitle>Editar Pedido {order.orderNumber}</CardTitle>
        <CardDescription>
          Atualize os itens e quantidades deste pedido. As alterações não mudam
          o status nem o caixa, apenas o conteúdo do pedido.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-32">Quantidade</TableHead>
                <TableHead className="w-32">Preço</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const lineTotal = (item.price || 0) * (item.quantity || 0);

                return (
                  <TableRow key={`${item.productId}-${index}`}>
                    <TableCell>
                      <Select
                        value={item.productId}
                        onValueChange={(value) =>
                          handleChangeProduct(index, value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleChangeQuantity(index, e.target.value)
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      {item.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {lineTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum item neste pedido. Adicione itens para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center">
            <Button variant="outline" type="button" onClick={handleAddItem}>
              Adicionar item
            </Button>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Total do pedido</p>
              <p className="text-xl font-semibold">
                {total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || items.length === 0}
        >
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </CardFooter>
    </Card>
  );
}

