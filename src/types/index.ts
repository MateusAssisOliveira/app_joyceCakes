import { LucideIcon } from "lucide-react";

export type TimestampLike = { toDate(): Date };

export type DateLike = string | Date | TimestampLike;

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

/** Estoque do produto na menor unidade inteira: gramas, mililitros ou unidades. */
export type ProductStockUnitType = "g" | "ml" | "un";

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
  /** Base do estoque; omitido em registros antigos → tratar como `un`. */
  unit_type?: ProductStockUnitType;
  /** Preferência de exibição (kg, L, caixa…); opcional. */
  display_unit?: string | null;
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
  /** Marca comercial (cadastro). */
  brand?: string;
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

/** Movimentação de estoque de insumo (ledger). */
export type SupplyInventoryMovementType =
  | "PURCHASE"
  | "ADJUSTMENT"
  | "SALE_CONSUME"
  | "PRODUCTION_CONSUME"
  | "PRODUCTION_OUTPUT";

export type InventoryMovement = {
  id: string;
  tenantId: string;
  item_type: "supply";
  supplyId: string | null;
  productId: string | null;
  movement_type: SupplyInventoryMovementType;
  quantity_delta: number;
  unit: string;
  unit_cost: number | null;
  note: string | null;
  orderId: string | null;
  created_at: string;
};

export type Recipe = TechnicalSheet;
export type RecipeIngredient = TechnicalSheetComponent;
