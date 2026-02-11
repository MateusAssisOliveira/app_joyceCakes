
// CAMADA DE SERVIÇO PARA PEDIDOS (ORDERS)
//
// Propósito:
// Este arquivo abstrai toda a lógica de acesso e manipulação de dados
// relacionados a pedidos (Orders).
//
// Responsabilidade:
// - Fornecer uma API clara e consistente para interagir com os dados de pedidos.
// - Conter as funções que a UI usará para criar, atualizar ou deletar pedidos.
// - Isolar os componentes da UI da implementação específica da fonte de dados.
//   (Agora usa o Firebase Firestore).

import type { Order, OrderItem, OrderStatus, Product, CashRegister } from "@/types";
import { collection, doc, Firestore, serverTimestamp, writeBatch, getDocs, getDoc, updateDoc, query, where, limit, Timestamp } from "firebase/firestore";
import { getProducts } from "./productService"; // Importa o serviço de produtos
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


/**
 * Calcula o custo total dos itens de um pedido e verifica o estoque.
 * @param products A lista de todos os produtos disponíveis.
 * @param orderItems Itens do pedido.
 * @returns Um objeto com o custo total, disponibilidade de estoque e mensagem de erro.
 */
async function processOrderItems(products: Product[], orderItems: OrderItem[]): Promise<{ totalCost: number; available: boolean; message: string }> {
    return processOrderItemsWithPolicy(products, orderItems, { allowUnknownProducts: false }).then((result) => ({
        totalCost: result.totalCost,
        available: result.available,
        message: result.message,
    }));
}

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
                message: `Quantidade inválida para o item "${orderItem.productName}".`,
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
                    message: `Produto com ID ${orderItem.productId} não encontrado.`,
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
                    message: `Estoque insuficiente para o produto "${product.name}". Necessário: ${newReserved}, Disponível: ${currentStock}`,
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
};

/**
 * Adiciona um novo pedido, deduz o estoque, lança a receita e o CMV no fluxo de caixa.
 * @param firestore Instância do Firestore.
 * @param newOrderData Os dados do novo pedido.
 */
export const addOrder = async (firestore: Firestore, newOrderData: NewOrderData): Promise<void> => {
    // 1. Busca o caixa ativo do usuário.
    const cashRegisterQuery = query(
        collection(firestore, `users/${newOrderData.userId}/cash_registers`),
        where('status', '==', 'open'),
        limit(1)
    );
    
    const registerSnap = await getDocs(cashRegisterQuery);

    if (registerSnap.empty) {
        throw new Error("Nenhum caixa aberto encontrado. Por favor, abra um caixa antes de registrar uma venda.");
    }
    const activeCashRegister = { id: registerSnap.docs[0].id, ...registerSnap.docs[0].data() } as CashRegister;

    const products = await getProducts(firestore); 

    const { totalCost, totalRevenue, normalizedItems, stockAdjustments, available, message } =
        await processOrderItemsWithPolicy(products, newOrderData.items, {
            allowUnknownProducts: newOrderData.allowUnknownProducts === true,
        });

    if (!available) {
        throw new Error(message);
    }
    
    const orderNumber = `PED-${Date.now()}`;
    const ordersCollection = collection(firestore, "orders");
    const orderRef = doc(ordersCollection);
    const movementsCollection = collection(
        firestore,
        `users/${newOrderData.userId}/cash_registers/${activeCashRegister.id}/financial_movements`
    );
    
    const fullOrderData: Omit<Order, 'id'> = {
        ...newOrderData,
        items: normalizedItems,
        total: totalRevenue,
        orderNumber: orderNumber,
        status: 'Pendente',
        createdAt: serverTimestamp() as Timestamp,
        cashRegisterId: activeCashRegister.id,
        totalCost: totalCost,
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
            batch.update(doc(firestore, "products", productId), {
                stock_quantity: updatedStock,
            });
        }

        const incomeRef = doc(movementsCollection);
        batch.set(incomeRef, {
            type: 'income',
            amount: totalRevenue,
            category: 'Venda de Produto',
            description: `Venda do Pedido ${orderNumber}`,
            paymentMethod: newOrderData.paymentMethod,
            orderId: orderRef.id,
            cashRegisterId: activeCashRegister.id,
            movementDate: serverTimestamp(),
        });

        if (totalCost > 0) {
            const expenseRef = doc(movementsCollection);
            batch.set(expenseRef, {
                type: 'expense',
                amount: totalCost,
                category: 'Custo de Produto Vendido',
                description: `Custo do Pedido ${orderNumber}`,
                paymentMethod: newOrderData.paymentMethod,
                orderId: orderRef.id,
                cashRegisterId: activeCashRegister.id,
                movementDate: serverTimestamp(),
            });
        }

        await batch.commit();
    } catch(serverError) {
        const permissionError = new FirestorePermissionError({
            path: ordersCollection.path,
            operation: 'create',
            requestResourceData: fullOrderData
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    };
};


/**
 * Atualiza os dados de um pedido existente, como itens e total.
 * @param firestore Instância do Firestore.
 * @param orderId O ID do pedido a ser atualizado.
 * @param updatedData Os novos dados para o pedido (itens e total).
 */
export const updateOrder = (
  firestore: Firestore,
  orderId: string,
  updatedData: { items: OrderItem[]; total: number }
): Promise<void> => {
    const orderRef = doc(firestore, 'orders', orderId);
    return getDoc(orderRef)
      .then(async (orderSnap) => {
        if (!orderSnap.exists()) {
            throw new Error("Pedido não encontrado para atualização.");
        }
        const existingOrder = { id: orderSnap.id, ...orderSnap.data() } as Order;
        const products = await getProducts(firestore);
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

        if (existingOrder.userId && existingOrder.cashRegisterId) {
            const movementPath = `users/${existingOrder.userId}/cash_registers/${existingOrder.cashRegisterId}/financial_movements`;
            const movementCollection = collection(firestore, movementPath);
            const movementSnapshot = await getDocs(
                query(movementCollection, where("orderId", "==", orderId))
            );

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
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
};


/**
 * Atualiza o status de um pedido específico.
 * @param firestore Instância do Firestore.
 * @param orderId O ID do pedido.
 * @param status O novo status do pedido.
 */
export const updateOrderStatus = (firestore: Firestore, orderId: string, status: OrderStatus): void => {
    const orderRef = doc(firestore, 'orders', orderId);
    const updatedData = { status };

    updateDoc(orderRef, updatedData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};


/**
 * Retorna uma lista de todos os pedidos.
 */
export const getOrders = async (firestore: Firestore): Promise<Order[]> => {
    const ordersCollection = collection(firestore, 'orders');
    try {
        const snapshot = await getDocs(ordersCollection);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
            } as Order;
        });
    } catch (error) {
        // Apenas relança o erro original. O cliente tratará de criar o erro contextual.
        throw error;
    }
};

