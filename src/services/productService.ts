import { collection, getDocs, Firestore, doc, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import type { Product } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { serializeObject, setDocumentActive } from './utils';
import { getTenantCollectionPath, resolveTenantIdOrThrow } from '@/lib/tenant';

export const addProduct = (
  firestore: Firestore,
  productData: Partial<Omit<Product, 'id' | 'createdAt' | 'isActive'>>,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const productsCollection = collection(firestore, getTenantCollectionPath(currentTenantId, 'products'));
  const fullProductData = {
    ...productData,
    tenantId: currentTenantId,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  return addDoc(productsCollection, fullProductData)
    .then(() => {})
    .catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: productsCollection.path,
        operation: 'create',
        requestResourceData: fullProductData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    });
};

export const updateProduct = (
  firestore: Firestore,
  id: string,
  updatedData: Partial<Omit<Product, 'id' | 'createdAt' | 'isActive'>>,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const productDocRef = doc(firestore, getTenantCollectionPath(currentTenantId, 'products'), id);
  return updateDoc(productDocRef, updatedData).catch(async () => {
    const permissionError = new FirestorePermissionError({
      path: productDocRef.path,
      operation: 'update',
      requestResourceData: updatedData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

export const inactivateProduct = (firestore: Firestore, id: string, tenantId?: string): void => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  setDocumentActive(firestore, getTenantCollectionPath(currentTenantId, 'products'), id, false);
};

export const reactivateProduct = (firestore: Firestore, id: string, tenantId?: string): void => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  setDocumentActive(firestore, getTenantCollectionPath(currentTenantId, 'products'), id, true);
};

export const getProducts = async (firestore: Firestore, tenantId?: string): Promise<Product[]> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const productsCollection = collection(firestore, getTenantCollectionPath(currentTenantId, 'products'));
  try {
    const snapshot = await getDocs(productsCollection);
    if (snapshot.empty) {
      console.warn('Nenhum produto encontrado no Firestore.');
      return [];
    }
    return snapshot.docs.map((item) => {
      const data = item.data();
      const docWithId = { id: item.id, ...data };
      return serializeObject(docWithId) as Product;
    });
  } catch (error) {
    throw error;
  }
};
