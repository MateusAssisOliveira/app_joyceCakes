
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

const pageConfig: Record<string, { title: string, description: string }> = {
  '/admin/dashboard': {
    title: 'Dashboard',
    description: 'Veja o que vendeu, o que lucrou, o que falta no estoque e pedidos pendentes.',
  },
  '/admin/orders': {
    title: 'Vendas',
    description: 'Crie pedidos e acompanhe o andamento de cada venda.',
  },
   '/admin/orders/edit': {
    title: 'Editando Pedido',
    description: 'Ajuste itens, quantidades e dados do cliente.',
  },
  '/admin/inventory': {
    title: 'Estoque',
    description: 'Controle ingredientes e embalagens em um só lugar.',
  },
  '/admin/supplies/report': {
    title: 'Relatório de Estoque',
    description: 'Resumo completo de entradas, saídas e saldo dos itens.',
  },
  '/admin/products': {
    title: 'Produtos',
    description: 'Gerencie os produtos finais e ajuste preços.',
  },
  '/admin/recipes': {
    title: 'Receitas',
    description: 'Monte receitas com cálculo automático de custo.',
  },
  '/admin/calculator': {
    title: 'Calculadora',
    description: 'Simule custo, margem e preço de venda em poucos passos.',
  },
  '/admin/cash-flow': {
    title: 'Financeiro',
    description: 'Acompanhe entradas, saídas e saldo do caixa.',
  },
  '/admin/operations': {
    title: 'Operações',
    description: 'Priorize tarefas do dia, sincronização e decisões rápidas.',
  },
};

export default function DynamicHeader() {
  const pathname = usePathname();
  
  // Encontra a configuração da página, permitindo que subrotas usem o cabeçalho da rota pai.
  const currentPage = Object.keys(pageConfig).find(path => pathname.startsWith(path));
  const config = currentPage ? pageConfig[currentPage] : null;

  if (!config) {
    return <div className="w-full h-full" />; // Retorna um div vazio para manter o espaço
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
        <h1 className="font-headline text-2xl font-bold text-foreground">
            {config.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 hidden md:block">
            {config.description}
        </p>
    </div>
  );
}
