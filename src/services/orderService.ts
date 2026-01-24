
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
import { collection, doc, Firestore, serverTimestamp, writeBatch, getDoc, getDocs, DocumentReference, updateDoc, addDoc, query, where, limit, Timestamp } from "firebase/firestore";
import { addFinancialMovement } from "./financialMovementService";
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
    let totalCost = 0;

    for (const orderItem of orderItems) {
        const product = products.find(p => p.id === orderItem.productId);
        
        if (!product) return { totalCost: 0, available: false, message: `Produto com ID ${orderItem.productId} não encontrado.` };
        
        totalCost += (product.costPrice || 0) * orderItem.quantity;
        orderItem.costPrice = product.costPrice || 0;
        
        if (product.stock_quantity !== undefined) {
            const currentStock = product.stock_quantity;
            if (currentStock < orderItem.quantity) {
                 return { totalCost: 0, available: false, message: `Estoque insuficiente para o produto "${product.name}". Necessário: ${orderItem.quantity}, Disponível: ${currentStock}` };
            }
        }
    }

    return { totalCost, available: true, message: "" };
}

type NewOrderData = Omit<Order, "id" | "orderNumber" | "createdAt" | "status" | "cashRegisterId" | "totalCost">;

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

    const { totalCost, available, message } = await processOrderItems(products, newOrderData.items);

    if (!available) {
        throw new Error(message);
    }
    
    const orderNumber = `PED-${Date.now()}`;
    const ordersCollection = collection(firestore, "orders");
    
    const fullOrderData: Omit<Order, 'id'> = {
        ...newOrderData,
        orderNumber: orderNumber,
        status: 'Pendente',
        createdAt: serverTimestamp() as Timestamp,
        cashRegisterId: activeCashRegister.id,
        totalCost: totalCost,
    };

    try {
        const docRef = await addDoc(ordersCollection, fullOrderData);

        // Ações de sucesso
        addFinancialMovement(firestore, activeCashRegister, {
            type: 'income',
            amount: newOrderData.total,
            category: 'Venda de Produto',
            description: `Venda do Pedido ${orderNumber}`,
            paymentMethod: newOrderData.paymentMethod,
            orderId: docRef.id
        });

        if (totalCost > 0) {
            addFinancialMovement(firestore, activeCashRegister, {
                type: 'expense',
                amount: totalCost,
                category: 'Custo de Produto Vendido',
                description: `Custo do Pedido ${orderNumber}`,
                paymentMethod: newOrderData.paymentMethod,
                orderId: docRef.id
            });
        }
        
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
): void => {
    const orderRef = doc(firestore, 'orders', orderId);
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

