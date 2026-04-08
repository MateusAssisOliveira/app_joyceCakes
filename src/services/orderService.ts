import type { Order, OrderItem, OrderStatus, Product, CashRegister } from "@/types";
import {
  collection,
  doc,
  Firestore,
  serverTimestamp,
  writeBatch,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  limit,
  Timestamp,
} from "firebase/firestore";
import { getProducts } from "./productService";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";

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

export const addOrder = async (firestore: Firestore, newOrderData: NewOrderData): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(newOrderData.tenantId || newOrderData.userId);
  const cashRegisterQuery = query(
    collection(firestore, getTenantCollectionPath(currentTenantId, "cash_registers")),
    where("status", "==", "open"),
    limit(1)
  );

  const registerSnap = await getDocs(cashRegisterQuery);

  if (registerSnap.empty) {
    throw new Error("Nenhum caixa aberto encontrado. Abra um caixa antes de registrar uma venda.");
  }
  const activeCashRegister = { id: registerSnap.docs[0].id, ...registerSnap.docs[0].data() } as CashRegister;

  const products = await getProducts(firestore, currentTenantId);

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
  const ordersCollection = collection(firestore, getTenantCollectionPath(currentTenantId, "orders"));
  const orderRef = doc(ordersCollection);
  const movementsCollection = collection(
    firestore,
    `${getTenantCollectionPath(currentTenantId, "cash_registers")}/${activeCashRegister.id}/financial_movements`
  );

  const fullOrderData: Omit<Order, "id"> = {
    ...newOrderData,
    tenantId: currentTenantId,
    items: normalizedItems,
    total: totalRevenue,
    orderNumber,
    status: "Pendente",
    createdAt: serverTimestamp() as Timestamp,
    cashRegisterId: activeCashRegister.id,
    totalCost,
  };
  delete (fullOrderData as any).allowUnknownProducts;

  try {
    const batch = writeBatch(firestore);
    batch.set(orderRef, fullOrderData);

    for (const [productId, reservedQty] of stockAdjustments.entries()) {
      const product = products.find((p) => p.id === productId);
      if (!product || product.stock_quantity === undefined) {
        continue;
      }
      const updatedStock = (Number(product.stock_quantity) || 0) - reservedQty;
      batch.update(doc(firestore, getTenantCollectionPath(currentTenantId, "products"), productId), {
        stock_quantity: updatedStock,
      });
    }

    const incomeRef = doc(movementsCollection);
    batch.set(incomeRef, {
      type: "income",
      amount: totalRevenue,
      category: "Venda de Produto",
      description: `Venda do Pedido ${orderNumber}`,
      paymentMethod: newOrderData.paymentMethod,
      orderId: orderRef.id,
      cashRegisterId: activeCashRegister.id,
      tenantId: currentTenantId,
      movementDate: serverTimestamp(),
    });

    if (totalCost > 0) {
      const expenseRef = doc(movementsCollection);
      batch.set(expenseRef, {
        type: "expense",
        amount: totalCost,
        category: "Custo de Produto Vendido",
        description: `Custo do Pedido ${orderNumber}`,
        paymentMethod: newOrderData.paymentMethod,
        orderId: orderRef.id,
        cashRegisterId: activeCashRegister.id,
        tenantId: currentTenantId,
        movementDate: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch {
    const permissionError = new FirestorePermissionError({
      path: ordersCollection.path,
      operation: "create",
      requestResourceData: fullOrderData,
    });
    errorEmitter.emit("permission-error", permissionError);
    throw permissionError;
  }
};

export const updateOrder = (
  firestore: Firestore,
  orderId: string,
  updatedData: { items: OrderItem[]; total: number },
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const orderRef = doc(firestore, getTenantCollectionPath(currentTenantId, "orders"), orderId);
  return getDoc(orderRef)
    .then(async (orderSnap) => {
      if (!orderSnap.exists()) {
        throw new Error("Pedido nao encontrado para atualizacao.");
      }
      const existingOrder = { id: orderSnap.id, ...orderSnap.data() } as Order;
      const products = await getProducts(firestore, currentTenantId);
      const processed = await processOrderItemsWithPolicy(products, updatedData.items, {
        allowUnknownProducts: true,
      });

      if (!processed.available) {
        throw new Error(processed.message);
      }

      const batch = writeBatch(firestore);
      batch.update(orderRef, {
        items: processed.normalizedItems,
        total: processed.totalRevenue,
        totalCost: processed.totalCost,
      });

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

        batch.update(doc(firestore, getTenantCollectionPath(currentTenantId, "products"), productId), {
          stock_quantity: nextStock,
        });
      }

      if (existingOrder.cashRegisterId) {
        const movementPath = `${getTenantCollectionPath(currentTenantId, "cash_registers")}/${existingOrder.cashRegisterId}/financial_movements`;
        const movementCollection = collection(firestore, movementPath);
        const movementSnapshot = await getDocs(query(movementCollection, where("orderId", "==", orderId)));

        let incomeHandled = false;
        let expenseHandled = false;
        movementSnapshot.docs.forEach((movementDoc) => {
          const data = movementDoc.data() as any;
          if (data.type === "income" && !incomeHandled) {
            batch.update(movementDoc.ref, {
              amount: processed.totalRevenue,
              description: `Venda do Pedido ${existingOrder.orderNumber}`,
            });
            incomeHandled = true;
            return;
          }

          if (data.type === "expense" && !expenseHandled) {
            if (processed.totalCost > 0) {
              batch.update(movementDoc.ref, {
                amount: processed.totalCost,
                description: `Custo do Pedido ${existingOrder.orderNumber}`,
              });
            } else {
              batch.update(movementDoc.ref, {
                amount: 0,
                description: `Custo do Pedido ${existingOrder.orderNumber}`,
              });
            }
            expenseHandled = true;
          }
        });

        if (!incomeHandled) {
          const incomeRef = doc(movementCollection);
          batch.set(incomeRef, {
            cashRegisterId: existingOrder.cashRegisterId,
            type: "income",
            category: "Venda de Produto",
            description: `Venda do Pedido ${existingOrder.orderNumber}`,
            amount: processed.totalRevenue,
            paymentMethod: existingOrder.paymentMethod,
            orderId,
            tenantId: currentTenantId,
            movementDate: serverTimestamp(),
          });
        }

        if (!expenseHandled && processed.totalCost > 0) {
          const expenseRef = doc(movementCollection);
          batch.set(expenseRef, {
            cashRegisterId: existingOrder.cashRegisterId,
            type: "expense",
            category: "Custo de Produto Vendido",
            description: `Custo do Pedido ${existingOrder.orderNumber}`,
            amount: processed.totalCost,
            paymentMethod: existingOrder.paymentMethod,
            orderId,
            tenantId: currentTenantId,
            movementDate: serverTimestamp(),
          });
        }
      }

      await batch.commit();
    })
    .catch(async (serverError) => {
      if (serverError instanceof Error && !(serverError as any).code) {
        throw serverError;
      }
      const permissionError = new FirestorePermissionError({
        path: orderRef.path,
        operation: "update",
        requestResourceData: updatedData,
      });
      errorEmitter.emit("permission-error", permissionError);
      throw permissionError;
    });
};

export const updateOrderStatus = (
  firestore: Firestore,
  orderId: string,
  status: OrderStatus,
  tenantId?: string
): void => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const orderRef = doc(firestore, getTenantCollectionPath(currentTenantId, "orders"), orderId);
  const updatedData = { status };

  updateDoc(orderRef, updatedData).catch(async () => {
    const permissionError = new FirestorePermissionError({
      path: orderRef.path,
      operation: "update",
      requestResourceData: updatedData,
    });
    errorEmitter.emit("permission-error", permissionError);
    throw permissionError;
  });
};

export const getOrders = async (firestore: Firestore, tenantId?: string): Promise<Order[]> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const ordersCollection = collection(firestore, getTenantCollectionPath(currentTenantId, "orders"));
  try {
    const snapshot = await getDocs(ordersCollection);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as Order;
    });
  } catch (error) {
    throw error;
  }
};
