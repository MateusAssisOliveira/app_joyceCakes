
// CAMADA DE SERVIÇO PARA PRODUTOS (PRODUCTS)
//
// Propósito:
// Este arquivo abstrai a lógica de acesso a dados para os produtos.
//
// Responsabilidade:
// - Fornecer uma função para buscar a lista de todos os produtos do Firestore.
// - Isolar os componentes da implementação da fonte de dados.

import { collection, getDocs, Firestore, doc, serverTimestamp, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Product } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { serializeObject, setDocumentActive } from './utils';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Adiciona um novo produto. Por padrão, ele é criado como ativo.
 * @param firestore Instância do Firestore.
 * @param productData Os dados do novo produto (sem o id).
 */
export const addProduct = (firestore: Firestore, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'isActive'>>): Promise<void> => {
    const productsCollection = collection(firestore, "products");
    const fullProductData = {
        ...productData,
        isActive: true,
        createdAt: serverTimestamp(),
    };

    return addDoc(productsCollection, fullProductData)
      .then(() => {}) // Retorna uma promessa resolvida em caso de sucesso.
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: productsCollection.path,
            operation: 'create',
            requestResourceData: fullProductData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Relança o erro para o chamador saber da falha.
    });
};

/**
 * Atualiza um produto existente.
 * @param firestore Instância do Firestore.
 * @param id O ID do produto a ser atualizado.
 * @param updatedData Os novos dados para o produto.
 */
export const updateProduct = (firestore: Firestore, id: string, updatedData: Partial<Omit<Product, 'id' | 'createdAt' | 'isActive'>>): Promise<void> => {
    const productDocRef = doc(firestore, 'products', id);
    return updateDoc(productDocRef, updatedData)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: productDocRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Relança o erro para o chamador.
    });
};

/**
 * Inativa (soft delete) um produto, marcando `isActive` como false.
 * @param firestore Instância do Firestore.
 * @param id O ID do produto a ser inativado.
 */
export const inactivateProduct = (firestore: Firestore, id: string): void => {
    setDocumentActive(firestore, 'products', id, false);
};

/**
 * Reativa um produto, marcando `isActive` como true.
 * @param firestore Instância do Firestore.
 * @param id O ID do produto a ser reativado.
 */
export const reactivateProduct = (firestore: Firestore, id: string): void => {
    setDocumentActive(firestore, 'products', id, true);
};


/**
 * Retorna uma lista de todos os produtos do Firestore.
 */
export const getProducts = async (firestore: Firestore): Promise<Product[]> => {
    const productsCollection = collection(firestore, 'products');
    try {
        const snapshot = await getDocs(productsCollection);
        if (snapshot.empty) {
            console.warn("Nenhum produto encontrado no Firestore. Considere popular o banco de dados.");
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const docWithId = { id: doc.id, ...data };
            // Garante que todos os Timestamps sejam convertidos para strings antes de retornar.
            return serializeObject(docWithId) as Product;
        });
    } catch (error) {
        // Apenas relança o erro original. O cliente tratará de criar o erro contextual.
        throw error;
    }
};
