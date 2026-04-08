import type { TechnicalSheet } from "@/types";
import { collection, doc, Firestore, serverTimestamp, addDoc, updateDoc, getDocs } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { serializeObject, setDocumentActive } from "./utils";
import { getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";

export const addTechnicalSheet = (
  firestore: Firestore,
  sheetData: Omit<TechnicalSheet, "id" | "createdAt" | "isActive">,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const sheetsCollection = collection(firestore, getTenantCollectionPath(currentTenantId, "technical_sheets"));

  const fullSheetData = {
    ...sheetData,
    tenantId: currentTenantId,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  return addDoc(sheetsCollection, fullSheetData)
    .then(() => {})
    .catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: sheetsCollection.path,
        operation: "create",
        requestResourceData: fullSheetData,
      });
      errorEmitter.emit("permission-error", permissionError);
      throw permissionError;
    });
};

export const updateTechnicalSheet = (
  firestore: Firestore,
  id: string,
  updatedData: Partial<Omit<TechnicalSheet, "id" | "createdAt" | "isActive">>,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const sheetDocRef = doc(firestore, getTenantCollectionPath(currentTenantId, "technical_sheets"), id);
  const dataToUpdate = { ...updatedData };

  return updateDoc(sheetDocRef, dataToUpdate).catch(async () => {
    const permissionError = new FirestorePermissionError({
      path: sheetDocRef.path,
      operation: "update",
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit("permission-error", permissionError);
    throw permissionError;
  });
};

export const inactivateTechnicalSheet = (firestore: Firestore, id: string, tenantId?: string): void => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  setDocumentActive(firestore, getTenantCollectionPath(currentTenantId, "technical_sheets"), id, false);
};

export const reactivateTechnicalSheet = (firestore: Firestore, id: string, tenantId?: string): void => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  setDocumentActive(firestore, getTenantCollectionPath(currentTenantId, "technical_sheets"), id, true);
};

export const getTechnicalSheets = async (firestore: Firestore, tenantId?: string): Promise<TechnicalSheet[]> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const sheetsCollection = collection(firestore, getTenantCollectionPath(currentTenantId, "technical_sheets"));
  try {
    const snapshot = await getDocs(sheetsCollection);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((item) => {
      const data = item.data();
      const docWithId = { id: item.id, ...data };
      return serializeObject(docWithId) as TechnicalSheet;
    });
  } catch (error) {
    throw error;
  }
};
