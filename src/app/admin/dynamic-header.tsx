
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

const pageConfig: Record<string, { title: string, description: string }> = {
  '/admin/dashboard': {
    title: 'Dashboard de Performance',
    description: 'Visão geral em tempo real do seu negócio.',
  },
  '/admin/orders': {
    title: 'Ponto de Venda (PDV)',
    description: 'Crie novos pedidos ou gerencie os pedidos existentes em tempo real.',
  },
   '/admin/orders/edit': {
    title: 'Editando Pedido',
    description: 'Ajuste os itens, quantidades e detalhes do pedido selecionado.',
  },
  '/admin/inventory': {
    title: 'Gestão de Itens de Estoque',
    description: 'Gerencie ingredientes, embalagens e todos os seus insumos em um só lugar.',
  },
  '/admin/supplies/report': {
    title: 'Relatório de Estoque',
    description: 'Visão detalhada de todo o seu estoque: ingredientes e embalagens.',
  },
  '/admin/products': {
    title: 'Catálogo de Produtos',
    description: 'Monte produtos de venda, vincule receitas e defina preços.',
  },
  '/admin/recipes': {
    title: 'Livro de Fichas Técnicas',
    description: 'Crie e gerencie as fichas de base que compõem seus produtos.',
  },
  '/admin/calculator': {
    title: 'Calculadora de Custo Rápida',
    description: 'Calcule rapidamente o custo e o preço de venda de um item personalizado.',
  },
  '/admin/cash-flow': {
    title: 'Fluxo de Caixa',
    description: 'Gerencie as entradas, saídas e o status do seu caixa atual.',
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
