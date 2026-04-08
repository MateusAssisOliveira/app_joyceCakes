import {
  collection,
  getDocs,
  getDocsFromCache,
  type Firestore,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import type { ClientSummary, SyncRecord } from "@/lib/sync-client";

const RECONCILE_COLLECTIONS = [
  "products",
  "orders",
  "supplies",
  "order_items",
  "technical_sheets",
] as const;

function getActiveTenantIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem("activeTenantId");
  return value && value.trim().length > 0 ? value.trim() : null;
}

function getCollectionPath(collectionName: string, tenantId: string | null): string {
  if (!tenantId) {
    return collectionName;
  }
  return `tenants/${tenantId}/${collectionName}`;
}

function parseDateValue(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      const maybeDate = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(maybeDate.getTime()) ? null : maybeDate;
    } catch {
      return null;
    }
  }

  return null;
}

function getLatestUpdatedAt(docs: QueryDocumentSnapshot<DocumentData>[]): string | null {
  let latest: Date | null = null;

  for (const doc of docs) {
    const data = doc.data();
    const date =
      parseDateValue(data.updatedAt) ||
      parseDateValue(data.updated_at) ||
      parseDateValue(data.updatedat) ||
      parseDateValue(data.createdAt) ||
      parseDateValue(data.created_at) ||
      parseDateValue(data.createdat);

    if (date && (!latest || date > latest)) {
      latest = date;
    }
  }

  return latest ? latest.toISOString() : null;
}

async function getDocsPreferCache(firestore: Firestore, path: string) {
  const ref = collection(firestore, path);
  try {
    return await getDocsFromCache(ref);
  } catch {
    return await getDocs(ref);
  }
}

export function createFirestoreClientSummaryGetter(firestore: Firestore) {
  return async function getClientSummary(): Promise<ClientSummary> {
    const summary: ClientSummary = {};
    const tenantId = getActiveTenantIdFromStorage();

    for (const collectionName of RECONCILE_COLLECTIONS) {
      const path = getCollectionPath(collectionName, tenantId);
      const snapshot = await getDocsPreferCache(firestore, path);
      summary[collectionName] = {
        count: snapshot.size,
        latestUpdatedAt: getLatestUpdatedAt(snapshot.docs),
      };
    }

    return summary;
  };
}

function normalizeRecordForSync(table: string, id: string, data: DocumentData, tenantId: string | null): SyncRecord | null {
  const updatedAt = (
    parseDateValue(data.updatedAt) ||
    parseDateValue(data.updated_at) ||
    parseDateValue(data.updatedat) ||
    parseDateValue(data.createdAt) ||
    parseDateValue(data.created_at) ||
    parseDateValue(data.createdat) ||
    new Date()
  ).toISOString();

  const resolvedTenantId = data.tenantId || tenantId || undefined;

  if (table === "supplies") {
    const unit = data.unit || "un";
    const packageQuantity = Number(data.packageQuantity ?? 1);
    const costPerUnit = Number(data.costPerUnit ?? 0);
    const packageCost =
      data.packageCost != null
        ? Number(data.packageCost)
        : costPerUnit * (Number.isFinite(packageQuantity) && packageQuantity > 0 ? packageQuantity : 1);

    return {
      id,
      tenantId: resolvedTenantId,
      name: data.name || "Insumo",
      sku: data.sku || "",
      category: data.category || "Geral",
      type: data.type === "packaging" ? "packaging" : "ingredient",
      stock: Number(data.stock ?? 0),
      unit,
      costPerUnit,
      purchaseFormat:
        data.purchaseFormat ||
        (unit === "un" ? "unidade" : "pacote"),
      packageCost,
      packageQuantity: Number.isFinite(packageQuantity) && packageQuantity > 0 ? packageQuantity : 1,
      supplier: data.supplier || "",
      lastPurchaseDate: data.lastPurchaseDate || null,
      expirationDate: data.expirationDate || null,
      minStock: Number(data.minStock ?? 0),
      isActive: data.isActive !== false,
      updatedAt,
    };
  }

  if (table === "products") {
    return {
      id,
      tenantId: resolvedTenantId,
      name: data.name || "Produto",
      description: data.description || "",
      price: Number(data.price ?? 0),
      costPrice: Number(data.costPrice ?? 0),
      category: data.category || "Sem categoria",
      imageUrlId: data.imageUrlId || null,
      stock_quantity: Number(data.stock_quantity ?? 0),
      isActive: data.isActive !== false,
      updatedAt,
    };
  }

  if (table === "orders") {
    return {
      id,
      tenantId: resolvedTenantId,
      customerName: data.customerName || "Cliente",
      orderNumber: data.orderNumber || null,
      paymentMethod: data.paymentMethod || null,
      total: Number(data.total ?? 0),
      totalCost: Number(data.totalCost ?? 0),
      status: data.status || "Pendente",
      userId: data.userId || null,
      cashRegisterId: data.cashRegisterId || null,
      updatedAt,
    };
  }

  if (table === "technical_sheets") {
    return {
      id,
      tenantId: resolvedTenantId,
      name: data.name || "Receita",
      description: data.description || "",
      type: data.type || "base",
      components: Array.isArray(data.components) ? data.components : [],
      steps: data.steps || "",
      yield: data.yield || "",
      totalCost: Number(data.totalCost ?? 0),
      suggestedPrice: Number(data.suggestedPrice ?? 0),
      preparationTime: Number(data.preparationTime ?? 0),
      laborCost: Number(data.laborCost ?? 0),
      fixedCost: Number(data.fixedCost ?? 0),
      isActive: data.isActive !== false,
      updatedAt,
    };
  }

  if (table === "order_items") {
    return {
      id,
      tenantId: resolvedTenantId,
      order_id: data.order_id,
      product_id: data.product_id,
      quantity: Number(data.quantity ?? 0),
      price: Number(data.price ?? 0),
      updatedAt,
    };
  }

  return null;
}

export function createFirestoreTableDataGetter(firestore: Firestore) {
  return async function getTableData(table: string): Promise<SyncRecord[]> {
    const tenantId = getActiveTenantIdFromStorage();
    const path = getCollectionPath(table, tenantId);
    const snapshot = await getDocsPreferCache(firestore, path);
    const records: SyncRecord[] = [];

    for (const doc of snapshot.docs) {
      const normalized = normalizeRecordForSync(table, doc.id, doc.data(), tenantId);
      if (normalized) {
        records.push(normalized);
      }
    }

    return records;
  };
}
