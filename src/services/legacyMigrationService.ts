import {
  Firestore,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getSupplyPriceHistoryPath, getTenantCollectionPath } from '@/lib/tenant';
import { updateUserProfile } from './userService';

const BATCH_LIMIT = 400;

type MigrationResult = {
  products: number;
  supplies: number;
  suppliesPriceHistory: number;
  technicalSheets: number;
  financialCategories: number;
  orders: number;
  cashRegisters: number;
  financialMovements: number;
};

type SyncServerImportResult = {
  products: number;
  supplies: number;
  orders: number;
  technicalSheets: number;
};

const pickFirst = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
};

const toNumber = (value: any, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toStringValue = (value: any, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
};

const toBoolean = (value: any, fallback = true): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
};

const normalizeSupplyUnit = (value: any): 'kg' | 'g' | 'L' | 'ml' | 'un' => {
  const normalized = toStringValue(value, 'un').trim().toLowerCase();
  if (normalized === 'kg') return 'kg';
  if (normalized === 'g') return 'g';
  if (normalized === 'l') return 'L';
  if (normalized === 'ml') return 'ml';
  if (normalized === 'un' || normalized === 'u' || normalized === 'unidade') return 'un';
  return 'un';
};

const normalizeSupplyType = (value: any): 'ingredient' | 'packaging' => {
  const normalized = toStringValue(value, 'ingredient').trim().toLowerCase();
  return normalized === 'packaging' ? 'packaging' : 'ingredient';
};

const normalizeOrderStatus = (value: any) => {
  const normalized = toStringValue(value, 'Pendente');
  if (
    normalized === 'Pendente' ||
    normalized === 'Em Preparo' ||
    normalized === 'Pronto para Retirada' ||
    normalized === 'Entregue' ||
    normalized === 'Cancelado'
  ) {
    return normalized;
  }
  return 'Pendente';
};

const normalizeTechnicalSheet = (source: Record<string, any>, tenantId: string) =>
  removeUndefinedFields({
    ...source,
    name: toStringValue(pickFirst(source, ['name']), 'Receita sem nome'),
    description: toStringValue(pickFirst(source, ['description']), ''),
    type: pickFirst(source, ['type']) ?? 'base',
    components: Array.isArray(pickFirst(source, ['components'])) ? pickFirst(source, ['components']) : [],
    steps: toStringValue(pickFirst(source, ['steps']), ''),
    yield: toStringValue(pickFirst(source, ['yield']), ''),
    totalCost: toNumber(pickFirst(source, ['totalCost', 'totalcost']), 0),
    isActive: toBoolean(pickFirst(source, ['isActive', 'isactive']), true),
    suggestedPrice: toNumber(pickFirst(source, ['suggestedPrice', 'suggestedprice']), 0),
    tenantId,
    migratedAt: serverTimestamp(),
  });

const removeUndefinedFields = <T extends Record<string, any>>(obj: T): T => {
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

async function commitInChunks<T>(items: T[], writeChunk: (chunk: T[]) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_LIMIT) {
    const chunk = items.slice(i, i + BATCH_LIMIT);
    await writeChunk(chunk);
  }
}

async function loadLegacyTechnicalSheets(
  firestore: Firestore,
  userId: string
): Promise<Array<{ id: string; data: Record<string, any> }>> {
  const sourcePaths = [
    'technical_sheets',
    'technicalSheets',
    'recipes',
    `users/${userId}/technical_sheets`,
    `users/${userId}/technicalSheets`,
    `users/${userId}/recipes`,
  ];

  const uniqueById = new Map<string, Record<string, any>>();

  for (const path of sourcePaths) {
    try {
      const snapshot = await getDocs(collection(firestore, path));
      for (const docSnap of snapshot.docs) {
        if (!uniqueById.has(docSnap.id)) {
          uniqueById.set(docSnap.id, docSnap.data() as Record<string, any>);
        }
      }
    } catch {
      // Ignora fontes inexistentes/sem permissao e segue para as proximas.
    }
  }

  return Array.from(uniqueById.entries()).map(([id, data]) => ({ id, data }));
}

export async function migrateLegacyDataToTenant(
  firestore: Firestore,
  userId: string,
  tenantId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    products: 0,
    supplies: 0,
    suppliesPriceHistory: 0,
    technicalSheets: 0,
    financialCategories: 0,
    orders: 0,
    cashRegisters: 0,
    financialMovements: 0,
  };

  const rootCollections = [
    { key: 'products', path: 'products' },
    { key: 'supplies', path: 'supplies' },
    { key: 'technicalSheets', path: 'technical_sheets' },
    { key: 'financialCategories', path: 'financial_categories' },
    { key: 'orders', path: 'orders' },
  ] as const;

  for (const item of rootCollections) {
    const snapshot = await getDocs(collection(firestore, item.path));
    const docs = snapshot.docs;

    await commitInChunks(docs, async (chunk) => {
      const batch = writeBatch(firestore);
      for (const legacyDoc of chunk) {
        const targetRef = doc(firestore, getTenantCollectionPath(tenantId, item.path as any), legacyDoc.id);
        const rawData = legacyDoc.data() as Record<string, any>;
        const payload =
          item.path === 'technical_sheets'
            ? normalizeTechnicalSheet(rawData, tenantId)
            : removeUndefinedFields({
                ...rawData,
                tenantId,
                migratedAt: serverTimestamp(),
              });
        batch.set(
          targetRef,
          payload,
          { merge: true }
        );
      }
      await batch.commit();
    });

    result[item.key] += docs.length;

    if (item.path === 'supplies') {
      for (const supplyDoc of docs) {
        const historySnapshot = await getDocs(collection(firestore, `supplies/${supplyDoc.id}/price_history`));
        const historyDocs = historySnapshot.docs;

        await commitInChunks(historyDocs, async (chunk) => {
          const batch = writeBatch(firestore);
          for (const historyDoc of chunk) {
            const targetHistoryRef = doc(firestore, getSupplyPriceHistoryPath(tenantId, supplyDoc.id), historyDoc.id);
            batch.set(targetHistoryRef, historyDoc.data(), { merge: true });
          }
          await batch.commit();
        });

        result.suppliesPriceHistory += historyDocs.length;
      }
    }
  }

  // Compatibilidade com nomes antigos de colecao de receitas.
  if (result.technicalSheets === 0) {
    const legacySheets = await loadLegacyTechnicalSheets(firestore, userId);
    await commitInChunks(legacySheets, async (chunk) => {
      const batch = writeBatch(firestore);
      for (const legacyDoc of chunk) {
        const targetRef = doc(
          firestore,
          getTenantCollectionPath(tenantId, 'technical_sheets'),
          legacyDoc.id
        );
        const payload = normalizeTechnicalSheet(legacyDoc.data, tenantId);
        batch.set(targetRef, payload, { merge: true });
        result.technicalSheets += 1;
      }
      await batch.commit();
    });
  }

  const legacyCashRegisters = await getDocs(collection(firestore, `users/${userId}/cash_registers`));
  const cashRegisterDocs = legacyCashRegisters.docs;

  await commitInChunks(cashRegisterDocs, async (chunk) => {
    const batch = writeBatch(firestore);
    for (const registerDoc of chunk) {
      const targetRef = doc(firestore, getTenantCollectionPath(tenantId, 'cash_registers'), registerDoc.id);
      batch.set(
        targetRef,
        {
          ...registerDoc.data(),
          tenantId,
          migratedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
  });

  result.cashRegisters += cashRegisterDocs.length;

  for (const registerDoc of cashRegisterDocs) {
    const movementSnapshot = await getDocs(
      collection(firestore, `users/${userId}/cash_registers/${registerDoc.id}/financial_movements`)
    );
    const movementDocs = movementSnapshot.docs;

    await commitInChunks(movementDocs, async (chunk) => {
      const batch = writeBatch(firestore);
      for (const movementDoc of chunk) {
        const targetRef = doc(
          firestore,
          `${getTenantCollectionPath(tenantId, 'cash_registers')}/${registerDoc.id}/financial_movements`,
          movementDoc.id
        );
        batch.set(
          targetRef,
          {
            ...movementDoc.data(),
            tenantId,
            migratedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
    });

    result.financialMovements += movementDocs.length;
  }

  await updateUserProfile(firestore, userId, {
    activeTenantId: tenantId,
    legacyMigrationV1Done: true,
  });

  return result;
}

async function fetchSyncServerTable(table: 'products' | 'supplies' | 'orders' | 'technical_sheets'): Promise<any[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SYNC_SERVER || 'http://localhost:4000';
  const apiKey = process.env.NEXT_PUBLIC_SYNC_API_KEY;
  const response = await fetch(`${baseUrl}/api/sync/${table}`, {
    headers: apiKey ? { 'x-api-key': apiKey } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar ${table} do sync server: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.success !== true || !Array.isArray(payload?.data)) {
    throw new Error(`Resposta invalida do sync server para ${table}`);
  }

  return payload.data;
}

async function fetchSyncServerTableSafe(
  table: 'products' | 'supplies' | 'orders' | 'technical_sheets'
): Promise<any[]> {
  try {
    return await fetchSyncServerTable(table);
  } catch {
    return [];
  }
}

export async function importSyncServerDataToTenant(
  firestore: Firestore,
  userId: string,
  tenantId: string
): Promise<SyncServerImportResult> {
  const result: SyncServerImportResult = {
    products: 0,
    supplies: 0,
    orders: 0,
    technicalSheets: 0,
  };

  const [products, supplies, orders, technicalSheetsFromSync] = await Promise.all([
    fetchSyncServerTable('products'),
    fetchSyncServerTable('supplies'),
    fetchSyncServerTable('orders'),
    fetchSyncServerTableSafe('technical_sheets'),
  ]);

  await commitInChunks(products, async (chunk) => {
    const batch = writeBatch(firestore);
    for (const item of chunk) {
      if (!item?.id) continue;
      const targetRef = doc(firestore, getTenantCollectionPath(tenantId, 'products'), String(item.id));
      const createdAt = pickFirst(item, ['createdAt', 'createdat', 'updatedAt', 'updatedat']);
      const productData = removeUndefinedFields({
        name: toStringValue(pickFirst(item, ['name']), 'Sem nome'),
        description: toStringValue(pickFirst(item, ['description']), ''),
        price: toNumber(pickFirst(item, ['price'])),
        costPrice: toNumber(pickFirst(item, ['costPrice', 'costprice', 'cost_per_unit']), 0),
        category: toStringValue(pickFirst(item, ['category']), 'Geral'),
        imageUrlId: toStringValue(pickFirst(item, ['imageUrlId', 'imageurlid', 'image_url_id']), ''),
        stock_quantity: toNumber(pickFirst(item, ['stock_quantity', 'stockquantity', 'stock']), 0),
        createdAt: createdAt ?? serverTimestamp(),
        isActive: toBoolean(pickFirst(item, ['isActive', 'isactive']), true),
        tenantId,
        migratedAt: serverTimestamp(),
      });
      batch.set(
        targetRef,
        productData,
        { merge: true }
      );
      result.products += 1;
    }
    await batch.commit();
  });

  await commitInChunks(supplies, async (chunk) => {
    const batch = writeBatch(firestore);
    for (const item of chunk) {
      if (!item?.id) continue;
      const targetRef = doc(firestore, getTenantCollectionPath(tenantId, 'supplies'), String(item.id));
      const packageCost = pickFirst(item, ['packageCost', 'packagecost', 'package_cost']);
      const packageQuantity = pickFirst(item, ['packageQuantity', 'packagequantity', 'package_quantity']);
      const normalizedUnit = normalizeSupplyUnit(pickFirst(item, ['unit']));
      const normalizedCostPerUnit = toNumber(pickFirst(item, ['costPerUnit', 'costperunit', 'cost_per_unit']), 0);
      const normalizedPackageQuantity =
        packageQuantity !== undefined ? toNumber(packageQuantity, 1) : 1;
      const normalizedPurchaseFormat =
        pickFirst(item, ['purchaseFormat', 'purchaseformat', 'purchase_format']) ??
        (normalizedUnit === 'un' ? 'unidade' : 'pacote');
      const supplyData = removeUndefinedFields({
        name: toStringValue(pickFirst(item, ['name']), 'Sem nome'),
        sku: toStringValue(pickFirst(item, ['sku']), ''),
        category: toStringValue(pickFirst(item, ['category']), 'Geral'),
        type: normalizeSupplyType(pickFirst(item, ['type'])),
        stock: toNumber(pickFirst(item, ['stock']), 0),
        unit: normalizedUnit,
        costPerUnit: normalizedCostPerUnit,
        purchaseFormat: normalizedPurchaseFormat,
        packageCost:
          packageCost !== undefined
            ? toNumber(packageCost, normalizedCostPerUnit * normalizedPackageQuantity)
            : normalizedCostPerUnit * normalizedPackageQuantity,
        packageQuantity: normalizedPackageQuantity,
        supplier: toStringValue(pickFirst(item, ['supplier']), ''),
        lastPurchaseDate: pickFirst(item, ['lastPurchaseDate', 'lastpurchasedate', 'last_purchase_date']),
        expirationDate: pickFirst(item, ['expirationDate', 'expirationdate', 'expiration_date']),
        createdAt: pickFirst(item, ['createdAt', 'createdat']) ?? serverTimestamp(),
        minStock: toNumber(pickFirst(item, ['minStock', 'minstock', 'min_stock']), 0),
        isActive: toBoolean(pickFirst(item, ['isActive', 'isactive']), true),
        tenantId,
        migratedAt: serverTimestamp(),
      });
      batch.set(
        targetRef,
        supplyData,
        { merge: true }
      );
      result.supplies += 1;
    }
    await batch.commit();
  });

  await commitInChunks(orders, async (chunk) => {
    const batch = writeBatch(firestore);
    for (const item of chunk) {
      if (!item?.id) continue;
      const targetRef = doc(firestore, getTenantCollectionPath(tenantId, 'orders'), String(item.id));
      const createdAt = pickFirst(item, ['createdAt', 'createdat', 'updatedAt', 'updatedat']) ?? serverTimestamp();
      const paymentMethod = toStringValue(
        pickFirst(item, ['paymentMethod', 'paymentmethod']),
        'Nao informado'
      );
      const orderData = removeUndefinedFields({
        orderNumber: toStringValue(
          pickFirst(item, ['orderNumber', 'ordernumber']),
          `PED-${String(item.id).slice(0, 8)}`
        ),
        createdAt,
        date: pickFirst(item, ['date']) ?? createdAt,
        customerName: toStringValue(pickFirst(item, ['customerName', 'customername']), ''),
        userId: toStringValue(pickFirst(item, ['userId', 'userid']), userId),
        cashRegisterId: toStringValue(pickFirst(item, ['cashRegisterId', 'cashregisterid']), ''),
        paymentMethod,
        total: toNumber(pickFirst(item, ['total']), 0),
        totalCost: toNumber(pickFirst(item, ['totalCost', 'totalcost']), 0),
        status: normalizeOrderStatus(pickFirst(item, ['status'])),
        items: Array.isArray(item.items) ? item.items : [],
        tenantId,
        migratedAt: serverTimestamp(),
      });
      batch.set(
        targetRef,
        orderData,
        { merge: true }
      );
      result.orders += 1;
    }
    await batch.commit();
  });

  await commitInChunks(technicalSheetsFromSync, async (chunk) => {
    const batch = writeBatch(firestore);
    for (const item of chunk) {
      if (!item?.id) continue;
      const targetRef = doc(
        firestore,
        getTenantCollectionPath(tenantId, 'technical_sheets'),
        String(item.id)
      );
      const payload = normalizeTechnicalSheet(item, tenantId);
      batch.set(targetRef, payload, { merge: true });
      result.technicalSheets += 1;
    }
    await batch.commit();
  });

  // O sync server atual nao possui tabela technical_sheets.
  // Para nao perder receitas, migra de colecoes legadas do Firestore quando existirem.
  const legacySheets = result.technicalSheets === 0
    ? await loadLegacyTechnicalSheets(firestore, userId)
    : [];

  await commitInChunks(legacySheets, async (chunk) => {
    const batch = writeBatch(firestore);
    for (const legacyDoc of chunk) {
      const targetRef = doc(
        firestore,
        getTenantCollectionPath(tenantId, 'technical_sheets'),
        legacyDoc.id
      );
      const payload = removeUndefinedFields({
        ...normalizeTechnicalSheet(legacyDoc.data, tenantId),
      });
      batch.set(targetRef, payload, { merge: true });
      result.technicalSheets += 1;
    }
    await batch.commit();
  });

  await updateUserProfile(firestore, userId, {
    activeTenantId: tenantId,
  });

  return result;
}
