"use client";

import Link from "next/link";
import { useMemo } from "react";
import { collection, query, Timestamp, where } from "firebase/firestore";
import { DollarSign, Loader, PackageSearch, ShoppingBag, TrendingUp } from "lucide-react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { MetricCard } from "@/components/admin/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order, Supply } from "@/types";

const COMPLETED_ORDER_STATUS = new Set(["Entregue", "Pronto para Retirada"]);

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const todayOrdersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(todayStart))
    );
  }, [firestore, user, todayStart]);

  const suppliesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "supplies"),
      where("isActive", "==", true)
    );
  }, [firestore, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(todayOrdersQuery);
  const { data: supplies, isLoading: isSuppliesLoading } = useCollection<Supply>(suppliesQuery);

  const todayOrders = orders || [];
  const allSupplies = supplies || [];

  const completedOrders = useMemo(() => {
    return todayOrders.filter((order) => COMPLETED_ORDER_STATUS.has(order.status));
  }, [todayOrders]);

  const pendingOrders = useMemo(() => {
    return todayOrders
      .filter((order) => order.status === "Pendente" || order.status === "Em Preparo")
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }, [todayOrders]);

  const lowStockSupplies = useMemo(() => {
    return allSupplies
      .filter((supply) => supply.minStock > 0 && supply.stock <= supply.minStock)
      .sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock));
  }, [allSupplies]);

  const salesToday = useMemo(() => {
    return completedOrders.reduce((sum, order) => sum + order.total, 0);
  }, [completedOrders]);

  const profitToday = useMemo(() => {
    return completedOrders.reduce((sum, order) => sum + (order.total - (order.totalCost || 0)), 0);
  }, [completedOrders]);

  const metrics = useMemo(() => {
    return [
      {
        title: "Vendi hoje",
        value: salesToday.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        description: "Soma dos pedidos concluídos hoje.",
        icon: DollarSign,
        color: "hsl(var(--chart-1))",
      },
      {
        title: "Lucro de hoje",
        value: profitToday.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        description: "Total vendido menos custo dos pedidos concluídos.",
        icon: TrendingUp,
        color: "hsl(var(--chart-2))",
      },
      {
        title: "Pedidos pendentes",
        value: pendingOrders.length.toString(),
        description: "Pedidos que ainda exigem ação.",
        icon: ShoppingBag,
        color: "hsl(var(--chart-3))",
      },
      {
        title: "Estoque acabando",
        value: lowStockSupplies.length.toString(),
        description: "Itens abaixo ou no estoque mínimo.",
        icon: PackageSearch,
        color: "hsl(var(--chart-5))",
      },
    ];
  }, [salesToday, profitToday, pendingOrders.length, lowStockSupplies.length]);

  const isLoading = isOrdersLoading || isSuppliesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-lg font-semibold">Carregando seu painel...</p>
          <p className="text-sm text-muted-foreground">Buscando vendas, pedidos e estoque de hoje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos para resolver agora</CardTitle>
            <CardDescription>Atenda primeiro os pedidos mais recentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{order.customerName || "Cliente sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <Badge variant={order.status === "Pendente" ? "secondary" : "outline"}>{order.status}</Badge>
                  <p className="mt-1 text-sm font-medium">
                    {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem pedidos pendentes no momento.</p>
            )}
            <Button asChild className="w-full">
              <Link href="/admin/orders">Abrir Vendas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque para repor</CardTitle>
            <CardDescription>Priorize os itens que já chegaram no mínimo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockSupplies.slice(0, 5).map((supply) => (
              <div key={supply.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{supply.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Atual: {supply.stock} {supply.unit}
                  </p>
                </div>
                <Badge variant="destructive">
                  Min: {supply.minStock} {supply.unit}
                </Badge>
              </div>
            ))}
            {lowStockSupplies.length === 0 && (
              <p className="text-sm text-muted-foreground">Seu estoque está sob controle.</p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/inventory">Abrir Estoque</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
