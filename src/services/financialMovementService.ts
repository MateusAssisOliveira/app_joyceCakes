
// CAMADA DE SERVIÇO PARA MOVIMENTAÇÕES FINANCEIRAS

import type { FinancialMovement, CashRegister } from "@/types";
import { collection, doc, Firestore, serverTimestamp, addDoc, updateDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { updateUserProfile } from "./userService";

/**
 * Abre um novo caixa para o usuário e atualiza o perfil do usuário com o ID do caixa ativo.
 * @param firestore Instância do Firestore.
 * @param userId O ID do usuário.
 * @param initialBalance O saldo inicial do caixa.
 */
export const openCashRegister = (firestore: Firestore, userId: string, initialBalance: number): Promise<void> => {
    const cashRegisterCollection = collection(firestore, `users/${userId}/cash_registers`);
    
    const newRegisterData = {
        userId,
        initialBalance,
        openingDate: serverTimestamp(),
        status: 'open',
        closingDate: null,
        finalBalance: null,
        totalSales: 0,
        totalExpenses: 0,
    };

    return addDoc(cashRegisterCollection, newRegisterData)
      .then(async (docRef) => {
        // Após criar o caixa, atualiza o perfil do usuário com o ID do novo caixa.
        await updateUserProfile(firestore, userId, { activeCashRegisterId: docRef.id });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: cashRegisterCollection.path,
            operation: 'create',
            requestResourceData: newRegisterData
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Propaga o erro para o chamador se necessário
      });
};

/**
 * Fecha um caixa existente e limpa o ID do caixa ativo do perfil do usuário.
 * @param firestore Instância do Firestore.
 * @param userId O ID do usuário.
 * @param registerId O ID do caixa a ser fechado.
 * @param finalBalance O saldo final calculado.
 */
export const closeCashRegister = (firestore: Firestore, userId: string, registerId: string, finalBalance: number): Promise<void> => {
    const registerDocRef = doc(firestore, `users/${userId}/cash_registers`, registerId);

    const updatedData = {
        status: 'closed',
        closingDate: serverTimestamp(),
        finalBalance: finalBalance,
    };

    return updateDoc(registerDocRef, updatedData)
      .then(async () => {
        // Após fechar o caixa, limpa o campo do perfil do usuário.
        await updateUserProfile(firestore, userId, { activeCashRegisterId: null });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: registerDocRef.path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
};

/**
 * Adiciona uma nova movimentação financeira a um caixa.
 * @param firestore Instância do Firestore.
 * @param cashRegister O objeto do caixa ativo.
 * @param movementData Os dados da movimentação.
 */
export const addFinancialMovement = (
    firestore: Firestore, 
    cashRegister: CashRegister, 
    movementData: Omit<FinancialMovement, 'id' | 'movementDate' | 'cashRegisterId'>
): void => {
    if (!cashRegister.userId) {
        const error = new Error("ID do usuário não encontrado no caixa.");
        console.error(error);
        throw error;
    }
    const movementsCollection = collection(firestore, `users/${cashRegister.userId}/cash_registers/${cashRegister.id}/financial_movements`);
    
    const fullMovementData = {
        ...movementData,
        cashRegisterId: cashRegister.id,
        movementDate: serverTimestamp(),
    };

    addDoc(movementsCollection, fullMovementData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: movementsCollection.path,
            operation: 'create',
            requestResourceData: fullMovementData
        });
        errorEmitter.emit('permission-error', permissionError);
        // Não relançamos o erro aqui para manter o comportamento não-bloqueante original
    });
};

    