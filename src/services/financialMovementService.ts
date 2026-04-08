import type { FinancialMovement, CashRegister } from "@/types";
import { collection, doc, Firestore, serverTimestamp, addDoc, updateDoc, getDocs, query, where, limit } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { updateUserProfile } from "./userService";
import { getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";

export const openCashRegister = (
  firestore: Firestore,
  userId: string,
  initialBalance: number,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId || userId);
  const cashRegisterCollection = collection(firestore, getTenantCollectionPath(currentTenantId, "cash_registers"));

  const newRegisterData = {
    userId,
    tenantId: currentTenantId,
    initialBalance,
    openingDate: serverTimestamp(),
    status: "open",
    closingDate: null,
    finalBalance: null,
    totalSales: 0,
    totalExpenses: 0,
  };

  const openRegisterQuery = query(cashRegisterCollection, where("status", "==", "open"), limit(1));

  return getDocs(openRegisterQuery)
    .then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error("Ja existe um caixa aberto para este tenant.");
      }
    })
    .then(() => addDoc(cashRegisterCollection, newRegisterData))
    .then(async (docRef) => {
      await updateUserProfile(firestore, userId, { activeCashRegisterId: docRef.id, activeTenantId: currentTenantId });
    })
    .catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: cashRegisterCollection.path,
        operation: "create",
        requestResourceData: newRegisterData,
      });
      errorEmitter.emit("permission-error", permissionError);
      throw permissionError;
    });
};

export const closeCashRegister = (
  firestore: Firestore,
  userId: string,
  registerId: string,
  finalBalance: number,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId || userId);
  const registerDocRef = doc(firestore, getTenantCollectionPath(currentTenantId, "cash_registers"), registerId);

  const updatedData = {
    status: "closed",
    closingDate: serverTimestamp(),
    finalBalance,
  };

  return updateDoc(registerDocRef, updatedData)
    .then(async () => {
      await updateUserProfile(firestore, userId, { activeCashRegisterId: null, activeTenantId: currentTenantId });
    })
    .catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: registerDocRef.path,
        operation: "update",
        requestResourceData: updatedData,
      });
      errorEmitter.emit("permission-error", permissionError);
      throw permissionError;
    });
};

export const addFinancialMovement = (
  firestore: Firestore,
  cashRegister: CashRegister,
  movementData: Omit<FinancialMovement, "id" | "movementDate" | "cashRegisterId">,
  tenantId?: string
): Promise<void> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId || cashRegister.userId);
  const movementsCollection = collection(
    firestore,
    `${getTenantCollectionPath(currentTenantId, "cash_registers")}/${cashRegister.id}/financial_movements`
  );

  const fullMovementData = {
    ...movementData,
    cashRegisterId: cashRegister.id,
    tenantId: currentTenantId,
    movementDate: serverTimestamp(),
  };

  return addDoc(movementsCollection, fullMovementData)
    .then(() => {})
    .catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: movementsCollection.path,
        operation: "create",
        requestResourceData: fullMovementData,
      });
      errorEmitter.emit("permission-error", permissionError);
      throw permissionError;
    });
};
