
// CAMADA DE SERVIÇO PARA INSUMOS (SUPPLIES)
//
// Propósito:
// Este arquivo abstrai toda a lógica de acesso e manipulação de dados
// relacionados a insumos (matéria-prima).
//
// Responsabilidade:
// - Fornecer uma API para buscar, adicionar, atualizar e deletar insumos.
// - Isolar os componentes da UI da implementação da fonte de dados.

import type { Supply, CashRegister, PriceVariation } from '@/types';
import { toDate } from '@/lib/timestamp-utils';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { setDocumentActive } from './utils';
import { collection, doc, Firestore, serverTimestamp, Timestamp, writeBatch, getDocs, addDoc, updateDoc, query, where, limit, getDoc, orderBy } from 'firebase/firestore';
import { addFinancialMovement } from './financialMovementService';
import { serializeObject } from './utils';

type FinancialRegistrationData = {
  shouldRegister: boolean;
  userId: string;
  paymentMethod: string;
  description: string;
  amount: number;
}

/**
 * Adiciona um novo registro de histórico de preço para um insumo.
 * @param firestore Instância do Firestore.
 * @param supplyId O ID do insumo.
 * @param cost O novo custo por unidade.
 * @param supplier O fornecedor (opcional).
 */
const addPriceHistoryEntry = (firestore: Firestore, supplyId: string, cost: number, supplier?: string) => {
    const historyCollectionRef = collection(firestore, `supplies/${supplyId}/price_history`);
    addDoc(historyCollectionRef, {
        date: serverTimestamp(),
        costPerUnit: cost,
        supplier: supplier || '',
    });
};

/**
 * Adiciona um novo insumo e, opcionalmente, registra a despesa no caixa.
 * @param firestore Instância do Firestore.
 * @param supplyData Os dados do novo insumo.
 * @param financialData Dados para o registro financeiro opcional.
 */
export const addSupply = async (firestore: Firestore, supplyData: Omit<Supply, 'id' | 'createdAt' | 'isActive'>, financialData?: FinancialRegistrationData) => {
    const suppliesCollection = collection(firestore, 'supplies');
    const dataWithTimestamp = { 
        ...supplyData, 
        isActive: true, 
        createdAt: serverTimestamp(),
        lastPurchaseDate: (() => {
            const d = toDate(supplyData.lastPurchaseDate);
            return d ? Timestamp.fromDate(d) : serverTimestamp();
        })(),
        expirationDate: (() => {
            const d = toDate(supplyData.expirationDate);
            return d ? Timestamp.fromDate(d) : undefined;
        })(),
        packageCost: supplyData.packageCost ?? undefined,
        packageQuantity: supplyData.packageQuantity ?? undefined,
    };
    
    const newDocRef = await addDoc(suppliesCollection, dataWithTimestamp);

    // Adiciona a primeira entrada no histórico de preços
    addPriceHistoryEntry(firestore, newDocRef.id, dataWithTimestamp.costPerUnit, dataWithTimestamp.supplier);

    if (financialData?.shouldRegister && financialData.amount > 0) {
        const cashRegisterQuery = query(
            collection(firestore, `users/${financialData.userId}/cash_registers`),
            where('status', '==', 'open'),
            limit(1)
        );
        const registerSnap = await getDocs(cashRegisterQuery);
        if (registerSnap.empty) {
            console.warn("Nenhum caixa aberto. A despesa da compra não foi registrada.");
            return;
        }
        const activeCashRegister = { id: registerSnap.docs[0].id, ...registerSnap.docs[0].data() } as CashRegister;

        await addFinancialMovement(firestore, activeCashRegister, {
            type: 'expense',
            amount: financialData.amount,
            category: 'Compra de Insumos',
            description: financialData.description || `Compra de ${supplyData.name}`,
            paymentMethod: financialData.paymentMethod,
        });
    }

    return newDocRef;
};

/**
 * Adiciona múltiplos insumos de uma só vez usando um batch.
 * @param firestore Instância do Firestore.
 * @param suppliesData Array com os dados dos novos insumos.
 */
export const addSuppliesInBatch = async (firestore: Firestore, suppliesData: Omit<Supply, 'id' | 'createdAt' | 'isActive'>[]) => {
    const batch = writeBatch(firestore);
    const suppliesCollection = collection(firestore, 'supplies');

    suppliesData.forEach(supplyData => {
        const newDocRef = doc(suppliesCollection);
        const dataWithTimestamp = {
            ...supplyData,
            isActive: true,
            createdAt: serverTimestamp(),
            lastPurchaseDate: (() => {
                const d = toDate(supplyData.lastPurchaseDate);
                return d ? Timestamp.fromDate(d) : undefined;
            })(),
            expirationDate: (() => {
                const d = toDate(supplyData.expirationDate);
                return d ? Timestamp.fromDate(d) : undefined;
            })(),
        };
        batch.set(newDocRef, dataWithTimestamp);

        // Adiciona a entrada inicial no histórico de preços para cada novo item
        const historyCollectionRef = doc(collection(firestore, `supplies/${newDocRef.id}/price_history`));
        batch.set(historyCollectionRef, {
            date: serverTimestamp(),
            costPerUnit: supplyData.costPerUnit,
            supplier: supplyData.supplier || '',
        });
    });

    await batch.commit();
};


/**
 * Atualiza um insumo existente.
 * @param id O ID do insumo a ser atualizado.
 * @param updatedData Os novos dados para o insumo.
 */
export const updateSupply = async (firestore: Firestore, id: string, updatedData: Partial<Omit<Supply, 'id' | 'createdAt' | 'isActive'>>, financialData?: FinancialRegistrationData) => {
    const supplyDocRef = doc(firestore, 'supplies', id);
    
    // Pega o documento antigo para comparar o preço
    const oldDocSnap = await getDoc(supplyDocRef);
    const oldData = oldDocSnap.data() as Supply;
    
    const dataToUpdate: any = { ...updatedData };

    if (dataToUpdate.lastPurchaseDate) {
        const d = toDate(dataToUpdate.lastPurchaseDate);
        dataToUpdate.lastPurchaseDate = d ? Timestamp.fromDate(d) : undefined;
    } else {
        dataToUpdate.lastPurchaseDate = undefined;
    }

    if (dataToUpdate.expirationDate) {
        const d = toDate(dataToUpdate.expirationDate);
        dataToUpdate.expirationDate = d ? Timestamp.fromDate(d) : undefined;
    } else {
        dataToUpdate.expirationDate = undefined;
    }

    dataToUpdate.packageCost = dataToUpdate.packageCost ?? undefined;
    dataToUpdate.packageQuantity = dataToUpdate.packageQuantity ?? undefined;
    
    await updateDoc(supplyDocRef, dataToUpdate);

    // Se o custo mudou, adiciona ao histórico
    if (oldData && oldData.costPerUnit !== dataToUpdate.costPerUnit) {
        addPriceHistoryEntry(firestore, id, dataToUpdate.costPerUnit, dataToUpdate.supplier);
    }

    if (financialData?.shouldRegister && financialData.amount > 0) {
        const cashRegisterQuery = query(
            collection(firestore, `users/${financialData.userId}/cash_registers`),
            where('status', '==', 'open'),
            limit(1)
        );
        const registerSnap = await getDocs(cashRegisterQuery);
        if (registerSnap.empty) {
            console.warn("Nenhum caixa aberto. A despesa da compra não foi registrada.");
            return;
        }
        const activeCashRegister = { id: registerSnap.docs[0].id, ...registerSnap.docs[0].data() } as CashRegister;

        await addFinancialMovement(firestore, activeCashRegister, {
            type: 'expense',
            amount: financialData.amount,
            category: 'Compra de Insumos',
            description: financialData.description || `Compra de ${dataToUpdate.name}`,
            paymentMethod: financialData.paymentMethod,
        });
    }
};

/**
 * Inativa (soft delete) um insumo, marcando `isActive` como false.
 * @param firestore Instância do Firestore.
 * @param id O ID do insumo a ser inativado.
 */
export const inactivateSupply = (firestore: Firestore, id: string): void => {
    setDocumentActive(firestore, 'supplies', id, false);
};

/**
 * Reativa um insumo, marcando `isActive` como true.
 * @param firestore Instância do Firestore.
 * @param id O ID do insumo a ser reativado.
 */
export const reactivateSupply = (firestore: Firestore, id: string): void => {
    setDocumentActive(firestore, 'supplies', id, true);
};

/**
 * Retorna uma lista de todos os insumos.
 */
export const getSupplies = async (firestore: Firestore): Promise<Supply[]> => {
    const suppliesCollection = collection(firestore, 'supplies');
    try {
        const snapshot = await getDocs(suppliesCollection);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const docWithId = { id: doc.id, ...data };
             // Garante que todos os Timestamps sejam convertidos para strings antes de retornar.
            return serializeObject(docWithId) as Supply;
        });
    } catch (error) {
        // Apenas relança o erro original. O cliente tratará de criar o erro contextual.
        throw error;
    }
};

/**
 * Retorna o histórico de preços de um insumo específico.
 * @param firestore Instância do Firestore.
 * @param supplyId O ID do insumo.
 */
export const getPriceHistory = async (firestore: Firestore, supplyId: string): Promise<PriceVariation[]> => {
    const historyCollection = collection(firestore, `supplies/${supplyId}/price_history`);
    try {
        const snapshot = await getDocs(query(historyCollection, orderBy('date', 'desc')));
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceVariation));
    } catch (error) {
        // Apenas relança o erro original. O cliente tratará de criar o erro contextual.
        throw error;
    }
};
