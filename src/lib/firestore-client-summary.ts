import {
  collection,
  getDocs,
  getDocsFromCache,
  type Firestore,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import type { ClientSummary, SyncRecord } from "@/lib/sync-client";

const RECONCILE_COLLECTIONS = ["products", "orders", "supplies", "order_items"] as const;

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
      parseDateValue(data.createdAt) ||
      parseDateValue(data.created_at);

    if (date && (!latest || date > latest)) {
      latest = date;
    }
  }

  return latest ? latest.toISOString() : null;
}

async function getDocsPreferCache(firestore: Firestore, collectionName: string) {
  const ref = collection(firestore, collectionName);
  try {
    return await getDocsFromCache(ref);
  } catch {
    return await getDocs(ref);
  }
}

export function createFirestoreClientSummaryGetter(firestore: Firestore) {
  return async function getClientSummary(): Promise<ClientSummary> {
    const summary: ClientSummary = {};

    for (const collectionName of RECONCILE_COLLECTIONS) {
      const snapshot = await getDocsPreferCache(firestore, collectionName);
      summary[collectionName] = {
        count: snapshot.size,
        latestUpdatedAt: getLatestUpdatedAt(snapshot.docs),
      };
    }

    return summary;
  };
}

function normalizeRecordForSync(table: string, id: string, data: DocumentData): SyncRecord | null {
  const updatedAt = (
    parseDateValue(data.updatedAt) ||
    parseDateValue(data.updated_at) ||
    parseDateValue(data.createdAt) ||
    parseDateValue(data.created_at) ||
    new Date()
  ).toISOString();

  if (table === "supplies") {
    return {
      id,
      name: data.name || "Insumo",
      stock: Number(data.stock ?? 0),
      unit: data.unit || "un",
      costPerUnit: Number(data.costPerUnit ?? 0),
      updatedAt,
    };
  }

  if (table === "products") {
    return {
      id,
      name: data.name || "Produto",
      description: data.description || "",
      price: Number(data.price ?? 0),
      category: data.category || "Sem categoria",
      imageUrlId: data.imageUrlId || null,
      stock_quantity: Number(data.stock_quantity ?? 0),
      updatedAt,
    };
  }

  if (table === "orders") {
    return {
      id,
      customerName: data.customerName || "Cliente",
      total: Number(data.total ?? 0),
      status: data.status || "Pendente",
      updatedAt,
    };
  }

  if (table === "order_items") {
    return {
      id,
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
    const snapshot = await getDocsPreferCache(firestore, table);
    const records: SyncRecord[] = [];

    for (const doc of snapshot.docs) {
      const normalized = normalizeRecordForSync(table, doc.id, doc.data());
      if (normalized) {
        records.push(normalized);
      }
    }

    return records;
  };
}
