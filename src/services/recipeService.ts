
// CAMADA DE SERVIÇO PARA FICHAS TÉCNICAS (TECHNICAL SHEETS)

import type { TechnicalSheet } from "@/types";
import { collection, doc, Firestore, serverTimestamp, addDoc, updateDoc, getDocs, Timestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { serializeObject, setDocumentActive } from "./utils";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

/**
 * Adiciona uma nova ficha técnica ao banco de dados. Por padrão, ela é criada como ativa.
 * @param firestore Instância do Firestore.
 * @param sheetData Os dados da nova ficha.
 */
export const addTechnicalSheet = (firestore: Firestore, sheetData: Omit<TechnicalSheet, "id" | "createdAt" | "isActive">): Promise<void> => {
  const sheetsCollection = collection(firestore, "technical_sheets");

  const fullSheetData = {
      ...sheetData,
      isActive: true,
      createdAt: serverTimestamp(),
  };

  return addDoc(sheetsCollection, fullSheetData)
    .then(() => {}) // Retorna Promise<void> no sucesso
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: sheetsCollection.path,
        operation: 'create',
        requestResourceData: fullSheetData
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError; // Propaga o erro para o chamador
  });
};

/**
 * Atualiza uma ficha técnica existente.
 * @param firestore Instância do Firestore.
 * @param id O ID da ficha a ser atualizada.
 * @param updatedData Os novos dados para a ficha.
 */
export const updateTechnicalSheet = (firestore: Firestore, id: string, updatedData: Partial<Omit<TechnicalSheet, 'id' | 'createdAt' | 'isActive'>>): Promise<void> => {
    const sheetDocRef = doc(firestore, 'technical_sheets', id);
    const dataToUpdate = { ...updatedData };

    return updateDoc(sheetDocRef, dataToUpdate)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: sheetDocRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

/**
 * Inativa uma ficha técnica.
 * @param firestore Instância do Firestore.
 * @param id O ID da ficha a ser inativada.
 */
export const inactivateTechnicalSheet = (firestore: Firestore, id: string): void => {
    setDocumentActive(firestore, 'technical_sheets', id, false);
};

/**
 * Reativa uma ficha técnica.
 * @param firestore Instância do Firestore.
 * @param id O ID da ficha a ser reativada.
 */
export const reactivateTechnicalSheet = (firestore: Firestore, id: string): void => {
    setDocumentActive(firestore, 'technical_sheets', id, true);
};

/**
 * Retorna uma lista de todas as fichas técnicas do Firestore.
 */
export const getTechnicalSheets = async (firestore: Firestore): Promise<TechnicalSheet[]> => {
    const sheetsCollection = collection(firestore, 'technical_sheets');
    try {
        const snapshot = await getDocs(sheetsCollection);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const docWithId = { id: doc.id, ...data };
            // Garante que todos os Timestamps sejam convertidos para strings antes de retornar.
            return serializeObject(docWithId) as TechnicalSheet;
        });
    } catch (error) {
        // Apenas relança o erro original. O hook cliente irá capturá-lo
        // e criar o erro contextual necessário.
        throw error;
    }
};
