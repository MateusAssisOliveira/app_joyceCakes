
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

// Permitir strings ISO, Date ou Firestore Timestamp em entradas/seed
export type DateLike = string | Date | Timestamp;

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  category: string;
  imageUrlId: string;
  stock_quantity: number;
  createdAt: DateLike;
  isActive: boolean;
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
};

export type FinancialMovement = {
  id: string;
  cashRegisterId: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  // Legacy data uses `date`; some code expects `movementDate` — aceitar ambos
  date?: DateLike;
  movementDate?: DateLike;
  // Legacy field names in mocks
  value?: number;
  method?: string;
  orderId?: string;
};

export type CashRegister = {
  id: string;
  userId: string;
  openingDate: DateLike;
  closingDate: DateLike | null;
  initialBalance: number;
  finalBalance: number | null;
  totalSales: number;
  totalExpenses: number;
  status: "open" | "closed";
};

export type OrderStatus =
  | "Pendente"
  | "Em Preparo"
  | "Pronto para Retirada"
  | "Entregue"
  | "Cancelado";

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
  createdAt: DateLike;
  // Algumas telas usam `customerName`/`date` — manter opcionais para compatibilidade
  customerName?: string;
  date?: DateLike;
  userId: string;
  cashRegisterId: string;
  paymentMethod: string;
  total: number;
  totalCost: number;
  status: OrderStatus;
  items: OrderItem[];
};

export type Supply = {
  id: string;
  name: string;
  sku: string;
  category: string;
  type: "ingredient" | "packaging";
  stock: number;
  unit: "kg" | "g" | "L" | "ml" | "un";
  costPerUnit: number;
  packageCost?: number;
  packageQuantity?: number;
  supplier?: string;
  lastPurchaseDate?: DateLike;
  expirationDate?: DateLike;
  createdAt?: DateLike;
  minStock: number;
  isActive: boolean;
};

export type TechnicalSheetComponent = {
  componentId: string;
  componentName: string;
  componentType: "supply" | "sheet" | "packaging";
  quantity: number;
  unit: string;
  lossFactor?: number; // some seed data included this on components
};

export type TechnicalSheet = {
  id: string;
  name: string;
  description: string;
  type: "base";
  components: TechnicalSheetComponent[];
  steps: string;
  yield: string;
  totalCost: number;
  createdAt?: DateLike;
  isActive: boolean;
  lossFactor?: number;
  suggestedPrice: number;
  preparationTime?: number;
  laborCost?: number;
  fixedCost?: number;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  activeCashRegisterId?: string | null;
};

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
};

export type PriceVariation = {
  id: string;
  date: DateLike;
  costPerUnit: number;
  supplier?: string;
};

export type Recipe = TechnicalSheet;
export type RecipeIngredient = TechnicalSheetComponent;
