
// ARQUIVO DE DEFINIÇÕES DE TIPOS (TYPESCRIPT)
//
// Propósito:
// Este arquivo centraliza todas as definições de tipos e interfaces TypeScript
// que são usadas em múltiplas partes da aplicação.
//
// Responsabilidade:
// - Definir a "forma" dos objetos de dados (ex: `Product`, `Order`, `Supply`).
// - Garantir a consistência e a segurança de tipos em todo o projeto, ajudando a
//   prevenir erros durante o desenvolvimento.

import { Timestamp } from "firebase/firestore";
import { LucideIcon } from "lucide-react";

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    costPrice?: number; // Custo de produção, vindo da ficha de montagem
    category: string;
    imageUrlId: string;
    stock_quantity: number;
    createdAt: string; // Alterado para string para serialização
    isActive: boolean;
    // Detalhes da montagem agora fazem parte do produto
    components?: TechnicalSheetComponent[];
    preparationTime?: number;
    laborCost?: number;
    fixedCost?: number;
};

export type DashboardMetric = {
    title: string;
    value: string;
    trend?: string;
    trendDirection?: "positive" | "negative";
    description?: string;
    icon?: LucideIcon;
    color?: string;
}

export type FinancialMovement = {
    id: string;
    cashRegisterId: string;
    type: "income" | "expense";
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
    movementDate: Date; // Convertido para Date pelo hook
    orderId?: string; // Vincula a movimentação ao pedido que a gerou
};


export type CashRegister = {
    id: string;
    userId: string;
    openingDate: Date; // Convertido para Date pelo hook
    closingDate: Date | null; // Convertido para Date pelo hook
    initialBalance: number;
    finalBalance: number | null;
    totalSales: number;
    totalExpenses: number;
    status: 'open' | 'closed';
}

export type OrderStatus = 'Pendente' | 'Em Preparo' | 'Pronto para Retirada' | 'Entregue' | 'Cancelado';

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice?: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: Date; // Convertido para Date pelo hook
  userId: string; // Usuário que criou o pedido
  cashRegisterId: string; // Caixa onde a venda foi registrada
  paymentMethod: string;
  total: number;
  totalCost: number; // Custo total dos produtos no pedido
  status: OrderStatus;
  items: OrderItem[];
};

export type Supply = {
  id: string;
  name: string;
  sku: string; // ID personalizado / código do produto
  category: string; // Categoria do insumo (ex: Secos, Laticínios)
  type: 'ingredient' | 'packaging'; // Tipo de insumo
  stock: number;
  unit: "kg" | "g" | "L" | "ml" | "un";
  costPerUnit: number;
  packageCost?: number; // Custo do pacote/caixa
  packageQuantity?: number; // Quantidade de unidades no pacote/caixa
  supplier: string; // Fornecedor
  lastPurchaseDate?: string; // Já é string
  expirationDate?: string; // Já é string
  minStock: number; // Estoque mínimo desejado
  createdAt?: string; // Já é string
  isActive: boolean;
};


export type TechnicalSheetComponent = {
  componentId: string; // Pode ser um supplyId ou outro technicalSheetId
  componentName: string;
  componentType: 'supply' | 'sheet';
  quantity: number;
  unit: string; // g, ml, un, etc.
}

export type TechnicalSheet = {
  id: string;
  name: string;
  description: string;
  type: 'base'; // Apenas 'base' (receita) agora
  components: TechnicalSheetComponent[];
  steps: string; // Modo de Preparo
  yield: string; // ex: "10 potes de 200g"
  totalCost: number;
  createdAt: string; // Já é string
  isActive: boolean;
  // Fator de perda aplicado ao custo total da receita.
  lossFactor?: number; 
  // Campos de preço e tempo movidos para Product
  suggestedPrice: number;
  preparationTime?: number; 
  laborCost?: number; 
  fixedCost?: number;
}

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  activeCashRegisterId?: string | null; // ID do caixa ativo atualmente
}


export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrlId: string;
  quantity: number;
};


export type HighlightCategory = {
    title: string;
    description: string;
    imageUrlId: string;
    href: string;
}

export type PriceVariation = {
    id: string;
    date: Timestamp; // Mantém Timestamp aqui pois é usado no lado do servidor/serviços
    costPerUnit: number;
    supplier?: string;
}

// Manter o tipo Recipe para retrocompatibilidade se necessário, mas usar TechnicalSheet para novo desenvolvimento
export type Recipe = TechnicalSheet;
export type RecipeIngredient = TechnicalSheetComponent;
