// DADOS SIMULADOS (MOCK DATA) PARA O DASHBOARD
//
// Propósito:
// Este arquivo centraliza todos os dados estáticos e simulados que são usados
// para popular os componentes visuais do dashboard.
//
// Responsabilidade:
// - Exportar arrays de objetos com dados para métricas, gráficos e listas.
// - Simular a resposta que viria de uma API de backend, permitindo o desenvolvimento
//   da UI de forma desacoplada da lógica de dados real.

import type { DashboardMetric, FinancialMovement, OrderStatus, HighlightCategory } from '@/types';

export const productCategories = [
  'Todos',
  'Bolos',
  'Tortas',
  'Cupcakes',
  'Cookies',
  'Doces Finos',
  'Pedidos Personalizados',
];

export const dashboardMetrics: DashboardMetric[] = [
    {
        title: "Vendas Hoje",
        value: "R$ 1.250,00",
        trend: "+12%",
        trendDirection: "positive",
        description: "Soma de todas as vendas concluídas no dia de hoje.",
    },
    {
        title: "Ticket Médio",
        value: "R$ 45,80",
        trend: "+5%",
        trendDirection: "positive",
        description: "Valor médio gasto por cliente em cada compra hoje.",
    },
    {
        title: "Margem de Lucro",
        value: "62%",
        trend: "-2%",
        trendDirection: "negative",
        description: "Percentual de lucro obtido sobre o custo total dos produtos vendidos.",
    },
    {
        title: "Caixa Atual",
        value: "R$ 2.180,50",
        description: "Saldo atual em dinheiro no caixa físico.",
    }
];

export const salesLast7Days = [
  { date: '1 dia atrás', Vendas: 1150 },
  { date: '2 dias atrás', Vendas: 980 },
  { date: '3 dias atrás', Vendas: 1300 },
  { date: '4 dias atrás', Vendas: 850 },
  { date: '5 dias atrás', Vendas: 1500 },
  { date: '6 dias atrás', Vendas: 1400 },
  { date: '7 dias atrás', Vendas: 1250 },
].reverse();

export const topProductsData = [
  { name: 'Bolo de Chocolate', 'vendas': 45, 'receita': 3397.50 },
  { name: 'Torta de Morango', 'vendas': 32, 'receita': 2176.00 },
  { name: 'Cupcake Red Velvet', 'vendas': 89, 'receita': 845.50 },
  { name: 'Cookies', 'vendas': 75, 'receita': 1875.00 },
  { name: 'Torta de Limão', 'vendas': 25, 'receita': 1625.00 },
];

export const cashFlowData = [
  { name: 'Seg', Entradas: 1200, Saídas: 400 },
  { name: 'Ter', Entradas: 1500, Saídas: 600 },
  { name: 'Qua', Entradas: 1100, Saídas: 300 },
  { name: 'Qui', Entradas: 1800, Saídas: 800 },
  { name: 'Sex', Entradas: 2500, Saídas: 1000 },
  { name: 'Sáb', Entradas: 3200, Saídas: 1200 },
  { name: 'Dom', Entradas: 900, Saídas: 200 },
];

export const paymentMethodsData = [
  { name: 'Cartão de Crédito', value: 45, fill: 'hsl(var(--chart-1))' },
  { name: 'Cartão de Débito', value: 25, fill: 'hsl(var(--chart-2))' },
  { name: 'PIX', value: 20, fill: 'hsl(var(--chart-3))' },
  { name: 'Dinheiro', value: 10, fill: 'hsl(var(--chart-5))' },
];

export const recentMovements: FinancialMovement[] = [
  { id: 'mov_001', date: '2024-07-29T14:35:00', description: 'Venda Pedido #1024', category: 'Venda Balcão', type: 'income', value: 85.50, method: 'PIX' },
  { id: 'mov_002', date: '2024-07-29T13:10:00', description: 'Pagamento Fornecedor de Farinha', category: 'Fornecedor', type: 'expense', value: -250.00, method: 'Transferência' },
  { id: 'mov_003', date: '2024-07-29T12:05:00', description: 'Venda Balcão', category: 'Venda Balcão', type: 'income', value: 45.00, method: 'Crédito' },
  { id: 'mov_004', date: '2024-07-29T10:15:00', description: 'Compra de Embalagens', category: 'Insumos', type: 'expense', value: -120.00, method: 'Débito' },
  { id: 'mov_005', date: '2024-07-29T09:30:00', description: 'Venda Pedido #1023', category: 'Pedido Online', type: 'income', value: 150.00, method: 'Crédito' },
  { id: 'mov_006', date: '2024-07-28T18:00:00', description: 'Conta de Energia', category: 'Despesa Fixa', type: 'expense', value: -180.30, method: 'Débito Automático' },
  { id: 'mov_007', date: '2024-07-28T15:20:00', description: 'Encomenda Evento #E-012', category: 'Encomenda/Evento', type: 'income', value: 450.00, method: 'Transferência' },
  { id: 'mov_008', date: '2024-07-28T11:45:00', description: 'Venda Balcão', category: 'Venda Balcão', type: 'income', value: 22.50, method: 'Dinheiro' },
  { id: 'mov_009', date: '2024-07-28T10:00:00', description: 'Pagamento Aluguel', category: 'Despesa Fixa', type: 'expense', value: -1200.00, method: 'Transferência' },
  { id: 'mov_010', date: '2024-07-27T16:50:00', description: 'Venda Pedido #1022', category: 'Pedido Online', type: 'income', value: 75.50, method: 'Crédito' },
];

export const orderStatuses: OrderStatus[] = ['Pendente', 'Em Preparo', 'Pronto para Retirada', 'Entregue', 'Cancelado'];

export const highlightCategories: HighlightCategory[] = [
    {
        title: "Bolo Red Velvet",
        description: "Massa aveludada, recheio de cream cheese e um toque sutil de cacau.",
        imageUrlId: "highlight-red-velvet",
        href: "/products",
    },
    {
        title: "Caixa de Brigadeiros Gourmet",
        description: "Sabores intensos: pistache, limão siciliano, chocolate belga e muito mais.",
        imageUrlId: "highlight-brigadeiros",
        href: "/products",
    },
    {
        title: "Macarons de Pâtisserie",
        description: "Casquinhas crocantes, recheios suaves e cores vibrantes que encantam.",
        imageUrlId: "highlight-macarons",
        href: "/products",
    },
];
