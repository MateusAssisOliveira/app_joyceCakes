import {
  collection,
  getDocs,
  getDocsFromCache,
  type Firestore,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import type { ClientSummary } from "@/lib/sync-client";

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

