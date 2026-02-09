/**
 * Validation Schemas using Zod
 * 
 * Propósito:
 * Centralizar validação de dados da aplicação de forma type-safe.
 * 
 * Responsabilidade:
 * - Validar dados de entrada em operações críticas
 * - Garantir integridade de dados no Firestore
 * - Reduzir erros causados por dados inválidos
 */

import { z } from 'zod';

// ==================== Common Schemas ====================

const PositiveNumber = z.number().positive('Deve ser um número positivo');
const NonNegativeNumber = z.number().min(0, 'Não pode ser negativo');
const NonEmptyString = z.string().trim().min(1, 'Não pode estar vazio');

// ==================== Order Schemas ====================

export const OrderItemSchema = z.object({
  productId: NonEmptyString,
  productName: NonEmptyString,
  quantity: z.number().int().positive('Quantidade deve ser maior que 0'),
  price: PositiveNumber,
  costPrice: NonNegativeNumber,
});

export const CreateOrderSchema = z.object({
  userId: NonEmptyString,
  clientName: NonEmptyString,
  items: z.array(OrderItemSchema).min(1, 'Pedido deve ter pelo menos um item'),
  paymentMethod: NonEmptyString,
  total: PositiveNumber,
  notes: z.string().optional(),
});

export const UpdateOrderSchema = z.object({
  items: z.array(OrderItemSchema).optional(),
  clientName: NonEmptyString.optional(),
  paymentMethod: NonEmptyString.optional(),
  notes: z.string().optional(),
});

// ==================== Product Schemas ====================

export const CreateProductSchema = z.object({
  name: NonEmptyString,
  description: z.string().optional(),
  price: PositiveNumber,
  costPrice: NonNegativeNumber,
  stock_quantity: NonNegativeNumber.default(0),
  minStockLevel: NonNegativeNumber.default(0),
});

export const UpdateProductSchema = z.object({
  name: NonEmptyString.optional(),
  description: z.string().optional(),
  price: PositiveNumber.optional(),
  costPrice: NonNegativeNumber.optional(),
  stock_quantity: NonNegativeNumber.optional(),
  minStockLevel: NonNegativeNumber.optional(),
});

// ==================== Supply Schemas ====================

export const CreateSupplySchema = z.object({
  name: NonEmptyString,
  unit: NonEmptyString,
  currentPrice: PositiveNumber,
  quantity: NonNegativeNumber,
  minStockLevel: NonNegativeNumber.default(0),
  supplier: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateSupplySchema = z.object({
  name: NonEmptyString.optional(),
  unit: NonEmptyString.optional(),
  currentPrice: PositiveNumber.optional(),
  quantity: NonNegativeNumber.optional(),
  minStockLevel: NonNegativeNumber.optional(),
  supplier: z.string().optional(),
  description: z.string().optional(),
});

// ==================== Recipe/Technical Sheet Schemas ====================

export const RecipeIngredientSchema = z.object({
  supplyId: NonEmptyString,
  supplyName: NonEmptyString,
  quantity: PositiveNumber,
  unit: NonEmptyString,
});

export const CreateRecipeSchema = z.object({
  name: NonEmptyString,
  description: z.string().optional(),
  ingredients: z.array(RecipeIngredientSchema).min(1, 'Receita deve ter pelo menos um ingrediente'),
  yield: PositiveNumber.optional(),
});

export const UpdateRecipeSchema = z.object({
  name: NonEmptyString.optional(),
  description: z.string().optional(),
  ingredients: z.array(RecipeIngredientSchema).optional(),
  yield: PositiveNumber.optional(),
});

// ==================== Cash Register Schemas ====================

export const OpenCashRegisterSchema = z.object({
  userId: NonEmptyString,
  initialBalance: NonNegativeNumber,
});

export const CreateFinancialMovementSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser income ou expense' })
  }),
  amount: PositiveNumber,
  category: NonEmptyString,
  description: NonEmptyString,
  paymentMethod: z.string().optional(),
});

// ==================== Validation Helper ====================

/**
 * Valida dados e lança erro com mensagem descriptiva se inválido
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
    
    throw new Error(`Dados inválidos: ${errors}`);
  }
  
  return result.data;
}

/**
 * Valida dados e retorna resultado sem lançar erro
 */
export function validateDataSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ),
    };
  }
  
  return { success: true, data: result.data };
}

// Type exports for use in components and services
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrderData = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderData = z.infer<typeof UpdateOrderSchema>;

export type CreateProductData = z.infer<typeof CreateProductSchema>;
export type UpdateProductData = z.infer<typeof UpdateProductSchema>;

export type CreateSupplyData = z.infer<typeof CreateSupplySchema>;
export type UpdateSupplyData = z.infer<typeof UpdateSupplySchema>;

export type CreateRecipeData = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeData = z.infer<typeof UpdateRecipeSchema>;

export type OpenCashRegisterData = z.infer<typeof OpenCashRegisterSchema>;
export type CreateFinancialMovementData = z.infer<typeof CreateFinancialMovementSchema>;
