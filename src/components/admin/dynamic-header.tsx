
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
  '/admin/supplies': {
    title: 'Controle de Ingredientes',
    description: 'Gerencie aqui os ingredientes que você usa para sua produção.',
  },
   '/admin/packaging': {
    title: 'Controle de Embalagens',
    description: 'Gerencie caixas, potes, fitas e outros itens de apresentação.',
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
    title: 'Livro de Receitas (Fichas de Base)',
    description: 'Crie e gerencie as receitas que compõem seus produtos.',
  },
  '/admin/cash-flow': {
    title: 'Fluxo de Caixa da Sessão Atual',
    description: 'Gerencie as entradas, saídas e o status do seu caixa aberto no momento.',
  },
};

export default function DynamicHeader() {
  const pathname = usePathname();
  
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
