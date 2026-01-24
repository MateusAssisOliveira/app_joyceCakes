
"use client";

import { useMemo } from 'react';
import { useUser, useCollection, useFirestore, useDoc } from "@/firebase";
import { collection, query, where, Timestamp, orderBy, limit, doc } from "firebase/firestore";
import type { Order, FinancialMovement, CashRegister, UserProfile, Supply } from "@/types";
import { MetricCard } from "@/components/admin/metric-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { TopProductsChart } from "@/components/admin/top-products-chart";
import { CashFlowChart } from "@/components/admin/cash-flow-chart";
import { PaymentMethodsChart } from "@/components/admin/payment-methods-chart";
import { RecentMovements } from "@/components/admin/recent-movements";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader, DollarSign, Info, ShoppingBag, Target, Scale } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LowStockAlert } from '@/components/admin/low-stock-alert';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  // --- QUERIES ---

  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Busca pedidos dos últimos 7 dias
  const ordersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo))
    );
  }, [firestore, user, sevenDaysAgo]);
  
  const { data: recentOrders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

  // Busca o perfil do usuário para encontrar o caixa ativo
  const userProfileRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // Busca o caixa ativo usando o ID do perfil
  const activeCashRegisterRef = useMemo(() => {
    if (!firestore || !user?.uid || !userProfile?.activeCashRegisterId) return null;
    return doc(firestore, `users/${user.uid}/cash_registers`, userProfile.activeCashRegisterId);
  }, [firestore, user, userProfile]);
  const { data: activeCashRegister, isLoading: isRegisterLoading } = useDoc<CashRegister>(activeCashRegisterRef);

  // Busca as movimentações do caixa ativo
  const recentMovementsQuery = useMemo(() => {
    if (!firestore || !user || !activeCashRegister) return null;
    return query(
      collection(firestore, `users/${user!.uid}/cash_registers/${activeCashRegister.id}/financial_movements`),
      orderBy('movementDate', 'desc'),
      limit(10) // Limita para o dashboard
    );
  }, [firestore, user, activeCashRegister]);
  const { data: recentMovements, isLoading: areMovementsLoading } = useCollection<FinancialMovement>(recentMovementsQuery);
  
  // Busca todos os insumos para o alerta de estoque baixo
  const suppliesQuery = useMemo(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'supplies'), where('isActive', '==', true));
  }, [firestore, user]);

  const { data: supplies, isLoading: areSuppliesLoading } = useCollection<Supply>(suppliesQuery);

  const getOrderDate = (order: Order): Date => {
    const date = order.createdAt;
    if (date instanceof Date) return date;
    if (date && typeof (date as any).toDate === 'function') return (date as any).toDate();
    return new Date();
  };
  
  const getMovementDate = (movement: FinancialMovement): Date => {
    const date = movement.movementDate;
    if (date instanceof Date) return date;
    if (date && typeof (date as any).toDate === 'function') return (date as any).toDate();
    return new Date();
  };

  const dashboardMetrics = useMemo(() => {
    if (!recentOrders) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesToday = recentOrders
      .filter(order => getOrderDate(order) >= today && (order.status === 'Entregue' || order.status === 'Pronto para Retirada'))
      .reduce((sum, order) => sum + order.total, 0);
      
    const completedOrdersToday = recentOrders.filter(order => getOrderDate(order) >= today && (order.status === 'Entregue' || order.status === 'Pronto para Retirada'));
    
    const ticketMedio = completedOrdersToday.length > 0 ? salesToday / completedOrdersToday.length : 0;
    
    // Calcula o saldo atual do caixa
    let currentBalance = 0;
    if (activeCashRegister && recentMovements) {
        const totalIncome = recentMovements.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0);
        const totalExpenses = recentMovements.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0);
        currentBalance = (activeCashRegister.initialBalance || 0) + totalIncome - totalExpenses;
    } else if (activeCashRegister) {
        currentBalance = activeCashRegister.initialBalance || 0;
    }


    return [
      {
        title: "Vendas Hoje",
        value: salesToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        description: "Soma de todas as vendas concluídas hoje.",
        icon: DollarSign,
        color: "hsl(var(--chart-1))",
      },
      {
        title: "Ticket Médio",
        value: ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        description: "Valor médio por compra hoje.",
        icon: Target,
        color: "hsl(var(--chart-2))",
      },
       {
        title: "Pedidos Hoje",
        value: completedOrdersToday.length.toString(),
        description: "Total de pedidos finalizados hoje.",
        icon: ShoppingBag,
        color: "hsl(var(--chart-3))",
    },
      {
        title: "Caixa Atual",
        value: currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        description: "Saldo atual do caixa aberto.",
        icon: Scale,
        color: "hsl(var(--chart-5))",
      }
    ];
  }, [recentOrders, activeCashRegister, recentMovements]);

  const salesLast7Days = useMemo(() => {
    if (!recentOrders) return [];
    
    const salesByDay: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        salesByDay[d.toLocaleDateString('pt-BR')] = 0;
    }

    recentOrders.forEach(order => {
        if (order.status === 'Entregue' || order.status === 'Pronto para Retirada') {
            const orderDate = getOrderDate(order).toLocaleDateString('pt-BR');
            if (orderDate in salesByDay) {
                salesByDay[orderDate] += order.total;
            }
        }
    });

    return Object.entries(salesByDay).map(([date, Vendas]) => ({
      date: new Date(date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit'}),
      Vendas
    })).reverse();

  }, [recentOrders]);
  
  const topProductsData = useMemo(() => {
    if (!recentOrders) return [];
    
    const productCounts: { [key: string]: { name: string; vendas: number } } = {};
    
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { name: item.productName, vendas: 0 };
        }
        productCounts[item.productId].vendas += item.quantity;
      });
    });
    
    return Object.values(productCounts)
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);
      
  }, [recentOrders]);
  
  const cashFlowData = useMemo(() => {
    if(!recentMovements) return [];
     const flowByDay: { [key: string]: { Entradas: number, Saídas: number } } = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,3);
        flowByDay[dayKey] = { Entradas: 0, Saídas: 0 };
    }
     recentMovements.forEach(movement => {
        const moveDate = getMovementDate(movement);
        const dayKey = moveDate.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,3);
        if(dayKey in flowByDay) {
            if(movement.type === 'income') flowByDay[dayKey].Entradas += movement.amount;
            if(movement.type === 'expense') flowByDay[dayKey].Saídas += movement.amount;
        }
    });

    return Object.entries(flowByDay).map(([name, values]) => ({ name, ...values })).reverse();
  }, [recentMovements]);

  const paymentMethodsData = useMemo(() => {
    if (!recentOrders) return [];

    const methodsCount: { [key: string]: number } = {};
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    let colorIndex = 0;

    recentOrders.forEach(order => {
        if (order.status === 'Entregue' || order.status === 'Pronto para Retirada') {
            methodsCount[order.paymentMethod] = (methodsCount[order.paymentMethod] || 0) + order.total;
        }
    });
    
    return Object.entries(methodsCount).map(([name, value]) => ({
      name,
      value,
      fill: colors[colorIndex++ % colors.length]
    }));
  }, [recentOrders]);

  const isLoading = areOrdersLoading || isProfileLoading || areSuppliesLoading || (userProfile?.activeCashRegisterId && (isRegisterLoading || areMovementsLoading));
  
  if (isLoading) {
      return (
        <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
                <p className="text-lg font-semibold">Carregando dados do dashboard...</p>
                <p className="text-sm text-muted-foreground">Buscando as informações mais recentes.</p>
            </div>
        </div>
      )
  }
  
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SalesChart salesData={salesLast7Days} />
        <TopProductsChart productsData={topProductsData} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <CashFlowChart cashFlowData={cashFlowData} />
        <PaymentMethodsChart paymentMethodsData={paymentMethodsData} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentMovements movements={recentMovements || []} />
        </div>
        <div className="flex flex-col gap-8">
          <LowStockAlert supplies={supplies || []} />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                  <CardTitle>Controle de Caixa</CardTitle>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                              <p className="max-w-xs">Gerencie o fluxo do seu caixa. Registre entradas (vendas manuais, aportes) e saídas (pagamentos, despesas) de forma rápida.</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
              <CardDescription>Abertura, fechamento e registro de movimentações.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button className="w-full" asChild>
                  <Link href="/admin/cash-flow">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Acessar Fluxo de Caixa
                  </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

    