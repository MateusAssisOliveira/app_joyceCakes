// BANCO DE DADOS EM MEMÓRIA (SIMULADO)
//
// Propósito:
// Este arquivo serve como uma fonte de dados simulada para a aplicação. Ele contém
// os dados brutos e as funções para manipulá-los diretamente.
//
// Responsabilidade:
// - Armazenar os arrays de dados para produtos, pedidos e insumos.
// - Conter as funções "internas" (`internal_...`) que manipulam esses arrays
//   (adicionar, atualizar, deletar). Essas funções não devem ser chamadas
//   diretamente pelos componentes da UI, mas sim pelos serviços (`/services`).
// - Simular o comportamento de um banco de dados real durante o desenvolvimento.

import type { Product, Order, OrderStatus, Supply } from '@/types';

// --- In-Memory Database ---
// Esta é a nossa fonte de dados simulada.
// Em uma aplicação real, isso seria substituído por um banco de dados real.

export let products: Product[] = []; // Removido para usar o Firebase

export let orders: Order[] = []; // Removido para usar o Firebase

export let supplies: Supply[] = []; // Removido para usar o Firebase

export const db = {
    products,
    orders,
    supplies
}

// --- Funções de Mutação ---
// Estas funções alteram os dados em memória.
// Em um app real, elas fariam chamadas para uma API ou diretamente para o banco de dados.

export const internal_addOrder = (newOrder: Omit<Order, 'id' | 'date' | 'status'>): Order => {
    const order: Order = {
        ...newOrder,
        id: `#PED-${(db.orders.length + 1).toString().padStart(3, '0')}`,
        date: new Date().toISOString(),
        status: 'Pendente',
    };
    db.orders.push(order);
    return order;
};

export const internal_updateOrder = (orderId: string, updatedData: Partial<Omit<Order, 'id' | 'date'>>): Order | undefined => {
    const index = db.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        db.orders[index] = { ...db.orders[index], ...updatedData };
        return db.orders[index];
    }
    return undefined;
};

export const internal_updateOrderStatus = (orderId: string, status: OrderStatus): Order | undefined => {
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        db.orders = [...db.orders]; // Garante nova referência de array para re-renderização
        return order;
    }
    return undefined;
};

export const internal_addSupply = (supply: Omit<Supply, 'id'>): Supply => {
    const newSupply: Supply = {
        ...supply,
        id: `supply_${Date.now()}`
    };
    db.supplies.push(newSupply);
    return newSupply;
};

export const internal_updateSupply = (id: string, updatedData: Omit<Supply, 'id'>): Supply | undefined => {
    const index = db.supplies.findIndex(s => s.id === id);
    if (index !== -1) {
        db.supplies[index] = { ...db.supplies[index], ...updatedData };
        return db.supplies[index];
    }
    return undefined;
};

export const internal_deleteSupply = (id: string): boolean => {
    const initialLength = db.supplies.length;
    db.supplies = db.supplies.filter(s => s.id !== id);
    return db.supplies.length < initialLength;
};
