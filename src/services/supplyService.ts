import type { Supply, CashRegister, PriceVariation } from '@/types';
import { toDate } from '@/lib/timestamp-utils';
import { setDocumentActive, serializeObject } from './utils';
import {
  collection,
  doc,
  Firestore,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  getDoc,
  orderBy,
  deleteField,
} from 'firebase/firestore';
import { addFinancialMovement } from './financialMovementService';
import { getSupplyPriceHistoryPath, getTenantCollectionPath, resolveTenantIdOrThrow } from '@/lib/tenant';

type FinancialRegistrationData = {
  shouldRegister: boolean;
  userId: string;
  paymentMethod: string;
  description: string;
  amount: number;
  tenantId?: string;
};

const stripUndefinedFields = <T extends Record<string, any>>(data: T): T => {
  const cleaned = { ...data } as Record<string, any>;
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned as T;
};

const addPriceHistoryEntry = (firestore: Firestore, tenantId: string, supplyId: string, cost: number, supplier?: string) => {
  const historyCollectionRef = collection(firestore, getSupplyPriceHistoryPath(tenantId, supplyId));
  addDoc(historyCollectionRef, {
    date: serverTimestamp(),
    costPerUnit: cost,
    supplier: supplier || '',
  });
};

export const addSupply = async (
  firestore: Firestore,
  supplyData: Omit<Supply, 'id' | 'createdAt' | 'isActive'>,
  financialData?: FinancialRegistrationData,
  tenantId?: string
) => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId || financialData?.tenantId || financialData?.userId);
  const suppliesCollection = collection(firestore, getTenantCollectionPath(currentTenantId, 'supplies'));

  const dataWithTimestamp = stripUndefinedFields({
    ...supplyData,
    tenantId: currentTenantId,
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
  });

  const newDocRef = await addDoc(suppliesCollection, dataWithTimestamp);
  addPriceHistoryEntry(firestore, currentTenantId, newDocRef.id, dataWithTimestamp.costPerUnit, dataWithTimestamp.supplier);

  if (financialData?.shouldRegister && financialData.amount > 0) {
    const cashRegisterQuery = query(
      collection(firestore, getTenantCollectionPath(currentTenantId, 'cash_registers')),
      where('status', '==', 'open'),
      limit(1)
    );
    const registerSnap = await getDocs(cashRegisterQuery);
    if (registerSnap.empty) {
      console.warn('Nenhum caixa aberto. A despesa da compra nao foi registrada.');
      return;
    }
    const activeCashRegister = { id: registerSnap.docs[0].id, ...registerSnap.docs[0].data() } as CashRegister;

    await addFinancialMovement(
      firestore,
      activeCashRegister,
      {
        type: 'expense',
        amount: financialData.amount,
        category: 'Compra de Insumos',
        description: financialData.description || `Compra de ${supplyData.name}`,
        paymentMethod: financialData.paymentMethod,
      },
      currentTenantId
    );
  }

  return newDocRef;
};

export const addSuppliesInBatch = async (
  firestore: Firestore,
  suppliesData: Omit<Supply, 'id' | 'createdAt' | 'isActive'>[],
  tenantId?: string
) => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const batch = writeBatch(firestore);
  const suppliesCollection = collection(firestore, getTenantCollectionPath(currentTenantId, 'supplies'));

  suppliesData.forEach((supplyData) => {
    const newDocRef = doc(suppliesCollection);
    const dataWithTimestamp = stripUndefinedFields({
      ...supplyData,
      tenantId: currentTenantId,
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
    });
    batch.set(newDocRef, dataWithTimestamp);

    const historyCollectionRef = doc(collection(firestore, getSupplyPriceHistoryPath(currentTenantId, newDocRef.id)));
    batch.set(historyCollectionRef, {
      date: serverTimestamp(),
      costPerUnit: supplyData.costPerUnit,
      supplier: supplyData.supplier || '',
    });
  });

  await batch.commit();
};

export const updateSupply = async (
  firestore: Firestore,
  id: string,
  updatedData: Partial<Omit<Supply, 'id' | 'createdAt' | 'isActive'>>,
  financialData?: FinancialRegistrationData,
  tenantId?: string
) => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId || financialData?.tenantId || financialData?.userId);
  const supplyDocRef = doc(firestore, getTenantCollectionPath(currentTenantId, 'supplies'), id);

  const oldDocSnap = await getDoc(supplyDocRef);
  const oldData = oldDocSnap.data() as Supply;

  const dataToUpdate: any = { ...updatedData };

  if (dataToUpdate.lastPurchaseDate) {
    const d = toDate(dataToUpdate.lastPurchaseDate);
    dataToUpdate.lastPurchaseDate = d ? Timestamp.fromDate(d) : deleteField();
  } else {
    dataToUpdate.lastPurchaseDate = deleteField();
  }

  if (dataToUpdate.expirationDate) {
    const d = toDate(dataToUpdate.expirationDate);
    dataToUpdate.expirationDate = d ? Timestamp.fromDate(d) : deleteField();
  } else {
    dataToUpdate.expirationDate = deleteField();
  }

  dataToUpdate.packageCost = dataToUpdate.packageCost ?? deleteField();
  dataToUpdate.packageQuantity = dataToUpdate.packageQuantity ?? deleteField();

  Object.keys(dataToUpdate).forEach((key) => {
    if (dataToUpdate[key] === undefined) {
      delete dataToUpdate[key];
    }
  });

  const sanitizedDataToUpdate = stripUndefinedFields(dataToUpdate);
  await updateDoc(supplyDocRef, sanitizedDataToUpdate);

  if (oldData && oldData.costPerUnit !== sanitizedDataToUpdate.costPerUnit) {
    addPriceHistoryEntry(firestore, currentTenantId, id, sanitizedDataToUpdate.costPerUnit, sanitizedDataToUpdate.supplier);
  }

  if (financialData?.shouldRegister && financialData.amount > 0) {
    const cashRegisterQuery = query(
      collection(firestore, getTenantCollectionPath(currentTenantId, 'cash_registers')),
      where('status', '==', 'open'),
      limit(1)
    );
    const registerSnap = await getDocs(cashRegisterQuery);
    if (registerSnap.empty) {
      console.warn('Nenhum caixa aberto. A despesa da compra nao foi registrada.');
      return;
    }
    const activeCashRegister = { id: registerSnap.docs[0].id, ...registerSnap.docs[0].data() } as CashRegister;

    await addFinancialMovement(
      firestore,
      activeCashRegister,
      {
        type: 'expense',
        amount: financialData.amount,
        category: 'Compra de Insumos',
        description: financialData.description || `Compra de ${sanitizedDataToUpdate.name}`,
        paymentMethod: financialData.paymentMethod,
      },
      currentTenantId
    );
  }
};

export const inactivateSupply = (firestore: Firestore, id: string, tenantId?: string): void => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  setDocumentActive(firestore, getTenantCollectionPath(currentTenantId, 'supplies'), id, false);
};

export const reactivateSupply = (firestore: Firestore, id: string, tenantId?: string): void => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  setDocumentActive(firestore, getTenantCollectionPath(currentTenantId, 'supplies'), id, true);
};

export const getSupplies = async (firestore: Firestore, tenantId?: string): Promise<Supply[]> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const suppliesCollection = collection(firestore, getTenantCollectionPath(currentTenantId, 'supplies'));
  try {
    const snapshot = await getDocs(suppliesCollection);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((item) => {
      const data = item.data();
      const docWithId = { id: item.id, ...data };
      return serializeObject(docWithId) as Supply;
    });
  } catch (error) {
    throw error;
  }
};

export const getPriceHistory = async (firestore: Firestore, supplyId: string, tenantId?: string): Promise<PriceVariation[]> => {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  const historyCollection = collection(firestore, getSupplyPriceHistoryPath(currentTenantId, supplyId));
  try {
    const snapshot = await getDocs(query(historyCollection, orderBy('date', 'desc')));
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PriceVariation));
  } catch (error) {
    throw error;
  }
};
