
import { Timestamp, Firestore, doc } from 'firebase/firestore';
import { isFirebaseTimestamp, isDateInstance } from '@/lib/timestamp-utils';
import { updateDocumentNonBlocking } from '@/firebase';

/**
 * Ativa ou desativa um documento no Firestore (soft delete)
 * Função genérica reutilizável para qualquer coleção
 *
 * @param firestore - Instância do Firestore
 * @param collectionName - Nome da coleção (supplies, technical_sheets, products, etc)
 * @param id - ID do documento
 * @param isActive - true para ativar, false para desativar
 */
export const setDocumentActive = (
  firestore: Firestore,
  collectionName: string,
  id: string,
  isActive: boolean
): void => {
  const docRef = doc(firestore, collectionName, id);
  updateDocumentNonBlocking(docRef, { isActive });
};

/**
 * Recursively converts Firestore Timestamps within an object to ISO date strings.
 * This is crucial for making Firestore data serializable and safe to pass from
 * Server Components to Client Components in Next.js.
 *
 * @param obj The object (or array) to process.
 * @returns A new object with all Timestamps converted to ISO strings.
 */
export function serializeObject<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Handle Firestore Timestamps
  if (isFirebaseTimestamp(obj)) {
    return obj.toDate().toISOString() as unknown as T;
  }
  
  // Handle native Date objects
  if (isDateInstance(obj)) {
    return obj.toISOString() as unknown as T;
  }

  // Handle arrays by recursively serializing each item
  if (Array.isArray(obj)) {
    return obj.map(item => serializeObject(item)) as unknown as T;
  }

  // Handle objects by recursively serializing each value
  const newObj = {} as { [key: string]: any };
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = serializeObject(obj[key as keyof T]);
    }
  }

  return newObj as T;
}
