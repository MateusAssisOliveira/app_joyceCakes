import type { Order, OrderItem, OrderStatus, Product } from "@/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { serializeObject } from "./utils";
import { getProducts } from "./productService";
import { errorEmitter } from "@/supabase/compat/error-emitter";
import { SupabaseStorePermissionError } from "@/supabase/compat/errors";
import { resolveTenantIdOrThrow } from "@/lib/tenant";

type ProcessPolicy = {
  allowUnknownProducts: boolean;
};

type ProcessResult = {
  totalCost: number;
  totalRevenue: number;
  normalizedItems: OrderItem[];
  stockAdjustments: Map<string, number>;
  available: boolean;
  message: string;
};

async function processOrderItemsWithPolicy(
  products: Product[],
  orderItems: OrderItem[],
  policy: ProcessPolicy
): Promise<ProcessResult> {
  let totalCost = 0;
  let totalRevenue = 0;
  const normalizedItems: OrderItem[] = [];
  const stockAdjustments = new Map<string, number>();
  const productsById = new Map(products.map((p) => [p.id, p]));

  for (const orderItem of orderItems) {
    const quantity = Number(orderItem.quantity) || 0;
    if (quantity <= 0) {
      return {
        totalCost: 0,
        totalRevenue: 0,
        normalizedItems: [],
        stockAdjustments: new Map(),
        available: false,
        message: `Quantidade invalida para o item "${orderItem.productName}".`,
      };
    }

    const product = productsById.get(orderItem.productId);

    if (!product) {
      if (!policy.allowUnknownProducts) {
        return {
          totalCost: 0,
          totalRevenue: 0,
          normalizedItems: [],
          stockAdjustments: new Map(),
          available: false,
          message: `Produto com ID ${orderItem.productId} nao encontrado.`,
        };
      }

      const unitPrice = Number(orderItem.price) || 0;
      const unitCost = Number(orderItem.costPrice) || 0;
      totalRevenue += unitPrice * quantity;
      totalCost += unitCost * quantity;
      normalizedItems.push({
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity,
        price: unitPrice,
        costPrice: unitCost,
      });
      continue;
    }

    const unitPrice = Number(product.price) || 0;
    const unitCost = Number(product.costPrice) || 0;

    totalRevenue += unitPrice * quantity;
    totalCost += unitCost * quantity;
    normalizedItems.push({
      productId: product.id,
      productName: product.name,
      quantity,
      price: unitPrice,
      costPrice: unitCost,
    });

    if (product.stock_quantity !== undefined) {
      const alreadyReserved = stockAdjustments.get(product.id) || 0;
      const newReserved = alreadyReserved + quantity;
      const currentStock = Number(product.stock_quantity) || 0;
      if (currentStock < newReserved) {
        return {
          totalCost: 0,
          totalRevenue: 0,
          normalizedItems: [],
          stockAdjustments: new Map(),
          available: false,
          message: `Estoque insuficiente para o produto "${product.name}". Necessario: ${newReserved}, Disponivel: ${currentStock}`,
        };
      }
      stockAdjustments.set(product.id, newReserved);
    }
  }

  return {
    totalCost,
    totalRevenue,
    normalizedItems,
    stockAdjustments,
    available: true,
    message: "",
  };
}

type NewOrderData = Omit<Order, "id" | "orderNumber" | "createdAt" | "status" | "cashRegisterId" | "totalCost"> & {
  allowUnknownProducts?: boolean;
  tenantId?: string;
};

export const addOrder = async (newOrderData: NewOrderData): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(newOrderData.tenantId || newOrderData.userId);
  const client = getSupabaseBrowserClient();

  const { data: activeCashRegister, error: cashError } = await client
    .from("cash_registers")
    .select("*")
    .eq("tenantId", currentTenantId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (cashError) throw cashError;
  if (!activeCashRegister) {
    throw new Error("Nenhum caixa aberto encontrado. Abra um caixa antes de registrar uma venda.");
  }

  const products = await getProducts(null, currentTenantId);

  const { totalCost, totalRevenue, normalizedItems, stockAdjustments, available, message } = await processOrderItemsWithPolicy(
    products,
    newOrderData.items,
    {
      allowUnknownProducts: newOrderData.allowUnknownProducts === true,
    }
  );

  if (!available) {
    throw new Error(message);
  }

  const orderNumber = `PED-${Date.now()}`;
  const fullOrderData: Omit<Order, "id"> = {
    ...newOrderData,
    tenantId: currentTenantId,
    items: normalizedItems,
    total: totalRevenue,
    orderNumber,
    status: "Pendente",
    createdAt: new Date().toISOString(),
    cashRegisterId: activeCashRegister.id,
    totalCost,
  };
  delete (fullOrderData as any).allowUnknownProducts;

  const { data: insertedOrder, error: orderError } = await client
    .from("orders")
    .insert(fullOrderData)
    .select("id")
    .maybeSingle();

  if (orderError) throw orderError;
  if (!insertedOrder?.id) {
    throw new Error("Falha ao criar pedido.");
  }

  const movementEntries = [
    {
      type: "income",
      amount: totalRevenue,
      category: "Venda de Produto",
      description: `Venda do Pedido ${orderNumber}`,
      paymentMethod: newOrderData.paymentMethod,
      orderId: insertedOrder.id,
      cashRegisterId: activeCashRegister.id,
      tenantId: currentTenantId,
      movementDate: new Date().toISOString(),
    },
  ];

  if (totalCost > 0) {
    movementEntries.push({
      type: "expense",
      amount: totalCost,
      category: "Custo de Produto Vendido",
      description: `Custo do Pedido ${orderNumber}`,
      paymentMethod: newOrderData.paymentMethod,
      orderId: insertedOrder.id,
      cashRegisterId: activeCashRegister.id,
      tenantId: currentTenantId,
      movementDate: new Date().toISOString(),
    });
  }

  const stockUpdatePromises: PromiseLike<any>[] = [];
  for (const [productId, reservedQty] of stockAdjustments.entries()) {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock_quantity === undefined) {
      continue;
    }
    const updatedStock = (Number(product.stock_quantity) || 0) - reservedQty;
    stockUpdatePromises.push(
      client
        .from("products")
        .update({ stock_quantity: updatedStock })
        .eq("tenantId", currentTenantId)
        .eq("id", productId)
        .then(() => ({})) // Convert to Promise
    );
  }

  const { error: movementError } = await client.from("financial_movements").insert(movementEntries);
  if (movementError) throw movementError;

  const cashRegisterUpdate = await client
    .from("cash_registers")
    .update({
      totalSales: (Number(activeCashRegister.totalSales) || 0) + totalRevenue,
      totalExpenses: (Number(activeCashRegister.totalExpenses) || 0) + totalCost,
    })
    .eq("tenantId", currentTenantId)
    .eq("id", activeCashRegister.id);

  if (cashRegisterUpdate.error) throw cashRegisterUpdate.error;

  if (stockUpdatePromises.length > 0) {
    const stockResults = await Promise.all(stockUpdatePromises);
    const stockError = stockResults.find((result) => result.error)?.error;
    if (stockError) throw stockError;
  }
};

export const updateOrder = async (
  orderId: string,
  updatedData: { items: OrderItem[]; total: number },
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const client = getSupabaseBrowserClient();

  const { data: existingOrder, error: existingOrderError } = await client
    .from("orders")
    .select("*")
    .eq("tenantId", currentTenantId)
    .eq("id", orderId)
    .maybeSingle();

  if (existingOrderError) throw existingOrderError;
  if (!existingOrder) {
    throw new Error("Pedido nao encontrado para atualizacao.");
  }

  const products = await getProducts(null, currentTenantId);
  const processed = await processOrderItemsWithPolicy(products, updatedData.items, {
    allowUnknownProducts: true,
  });

  if (!processed.available) {
    throw new Error(processed.message);
  }

  const previousQtyByProduct = new Map<string, number>();
  for (const item of existingOrder.items || []) {
    const qty = Number(item.quantity) || 0;
    previousQtyByProduct.set(item.productId, (previousQtyByProduct.get(item.productId) || 0) + qty);
  }

  const newQtyByProduct = new Map<string, number>();
  for (const item of processed.normalizedItems) {
    const qty = Number(item.quantity) || 0;
    newQtyByProduct.set(item.productId, (newQtyByProduct.get(item.productId) || 0) + qty);
  }

  const stockUpdatePromises: PromiseLike<any>[] = [];
  const allProductIds = new Set<string>([
    ...Array.from(previousQtyByProduct.keys()),
    ...Array.from(newQtyByProduct.keys()),
  ]);

  for (const productId of allProductIds) {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock_quantity === undefined) continue;

    const previousQty = previousQtyByProduct.get(productId) || 0;
    const newQty = newQtyByProduct.get(productId) || 0;
    const deltaQty = newQty - previousQty;
    if (deltaQty === 0) continue;

    const currentStock = Number(product.stock_quantity) || 0;
    const nextStock = currentStock - deltaQty;
    if (nextStock < 0) {
      throw new Error(
        `Estoque insuficiente para o produto "${product.name}" ao editar pedido. Necessario adicional: ${deltaQty}, Disponivel: ${currentStock}`
      );
    }

    stockUpdatePromises.push(
      client
        .from("products")
        .update({ stock_quantity: nextStock })
        .eq("tenantId", currentTenantId)
        .eq("id", productId)
        .then(() => ({})) // Convert to Promise
    );
  }

  const { error: updateOrderError } = await client
    .from("orders")
    .update({
      items: processed.normalizedItems,
      total: processed.totalRevenue,
      totalCost: processed.totalCost,
    })
    .eq("tenantId", currentTenantId)
    .eq("id", orderId);

  if (updateOrderError) throw updateOrderError;

  if (stockUpdatePromises.length > 0) {
    const stockResults = await Promise.all(stockUpdatePromises);
    const stockError = stockResults.find((result) => result.error)?.error;
    if (stockError) throw stockError;
  }

  if (existingOrder.cashRegisterId) {
    const { data: movements, error: movementsError } = await client
      .from("financial_movements")
      .select("*")
      .eq("tenantId", currentTenantId)
      .eq("orderId", orderId);

    if (movementsError) throw movementsError;

    let incomeHandled = false;
    let expenseHandled = false;
    const movementRequests: PromiseLike<any>[] = [];

    for (const movement of movements ?? []) {
      if (movement.type === "income" && !incomeHandled) {
        incomeHandled = true;
        movementRequests.push(
          client
            .from("financial_movements")
            .update({
              amount: processed.totalRevenue,
              description: `Venda do Pedido ${existingOrder.orderNumber}`,
            })
            .eq("tenantId", currentTenantId)
            .eq("id", movement.id)
            .then(() => ({})) // Convert to Promise
        );
        continue;
      }

      if (movement.type === "expense" && !expenseHandled) {
        expenseHandled = true;
        movementRequests.push(
          client
            .from("financial_movements")
            .update({
              amount: processed.totalCost > 0 ? processed.totalCost : 0,
              description: `Custo do Pedido ${existingOrder.orderNumber}`,
            })
            .eq("tenantId", currentTenantId)
            .eq("id", movement.id)
            .then(() => ({})) // Convert to Promise
        );
      }
    }

    if (!incomeHandled) {
      movementRequests.push(
        client.from("financial_movements").insert({
          type: "income",
          category: "Venda de Produto",
          description: `Venda do Pedido ${existingOrder.orderNumber}`,
          amount: processed.totalRevenue,
          paymentMethod: existingOrder.paymentMethod,
          orderId,
          cashRegisterId: existingOrder.cashRegisterId,
          tenantId: currentTenantId,
          movementDate: new Date().toISOString(),
        }).then(() => ({})) // Convert to Promise
      );
    }

    if (!expenseHandled && processed.totalCost > 0) {
      movementRequests.push(
        client.from("financial_movements").insert({
          type: "expense",
          category: "Custo de Produto Vendido",
          description: `Custo do Pedido ${existingOrder.orderNumber}`,
          amount: processed.totalCost,
          paymentMethod: existingOrder.paymentMethod,
          orderId,
          cashRegisterId: existingOrder.cashRegisterId,
          tenantId: currentTenantId,
          movementDate: new Date().toISOString(),
        }).then(() => ({})) // Convert to Promise
      );
    }

    if (movementRequests.length > 0) {
      const movementResults = await Promise.all(movementRequests);
      const movementError = movementResults.find((result) => result.error)?.error;
      if (movementError) throw movementError;
    }

    const salesDelta = Number(processed.totalRevenue) - Number(existingOrder.total || 0);
    const expensesDelta = Number(processed.totalCost) - Number(existingOrder.totalCost || 0);

    if (salesDelta !== 0 || expensesDelta !== 0) {
      // Get current values first
      const { data: currentRegister } = await client
        .from("cash_registers")
        .select("totalSales, totalExpenses")
        .eq("tenantId", currentTenantId)
        .eq("id", existingOrder.cashRegisterId)
        .single();

      if (currentRegister) {
        const newTotalSales = (Number(currentRegister.totalSales) || 0) + salesDelta;
        const newTotalExpenses = (Number(currentRegister.totalExpenses) || 0) + expensesDelta;

        const cashRegisterUpdate = await client
          .from("cash_registers")
          .update({
            totalSales: newTotalSales,
            totalExpenses: newTotalExpenses,
          })
          .eq("tenantId", currentTenantId)
          .eq("id", existingOrder.cashRegisterId);

      if (cashRegisterUpdate.error) {
        throw cashRegisterUpdate.error;
      }
    }
  }
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const client = getSupabaseBrowserClient();

  const { error } = await client
    .from("orders")
    .update({ status })
    .eq("tenantId", currentTenantId)
    .eq("id", orderId);

  if (error) {
    const permissionError = new SupabaseStorePermissionError({
      path: `orders/${orderId}`,
      operation: "update",
      requestResourceData: { status },
    });
    errorEmitter.emit("permission-error", permissionError);
    throw permissionError;
  }
};

export const getOrders = async (tenantId?: string): Promise<Order[]> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const client = getSupabaseBrowserClient();

  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("tenantId", currentTenantId)
    .order("createdAt", { ascending: false });

  if (error) throw error;

  return serializeObject((data ?? []) as Order[]);
};

export const getOrderById = async (
  orderId: string,
  tenantId?: string
): Promise<Order | null> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const client = getSupabaseBrowserClient();

  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("tenantId", currentTenantId)
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  return data ? serializeObject(data as Order) : null;
};
