import { Timestamp } from "firebase/firestore";
import { LucideIcon } from "lucide-react";

export type DateLike = string | Date | Timestamp;

export type TenantRole = "owner" | "admin" | "staff";

export type Tenant = {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt?: DateLike;
  updatedAt?: DateLike;
};

export type TenantMember = {
  id: string;
  userId: string;
  role: TenantRole;
  status: "active" | "invited" | "disabled";
  createdAt?: DateLike;
  updatedAt?: DateLike;
};

export type Product = {
  id: string;
  tenantId?: string;
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
  tenantId?: string;
  cashRegisterId: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date?: DateLike;
  movementDate?: DateLike;
  value?: number;
  method?: string;
  orderId?: string;
};

export type CashRegister = {
  id: string;
  tenantId?: string;
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
  tenantId?: string;
  orderNumber: string;
  createdAt: DateLike;
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
  tenantId?: string;
  name: string;
  sku: string;
  category: string;
  type: "ingredient" | "packaging";
  stock: number;
  unit: "kg" | "g" | "L" | "ml" | "un";
  costPerUnit: number;
  purchaseFormat?: "unidade" | "pacote" | "caixa" | "garrafa" | "saco" | "lata" | "frasco";
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
  lossFactor?: number;
};

export type TechnicalSheet = {
  id: string;
  tenantId?: string;
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
  role?: TenantRole;
  activeTenantId?: string | null;
  activeCashRegisterId?: string | null;
  legacyMigrationV1Done?: boolean;
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
