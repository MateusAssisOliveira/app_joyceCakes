import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseTimestamp, isDateInstance } from "@/lib/timestamp-utils";

const TABLE_NAMES = new Set([
  "products",
  "supplies",
  "technical_sheets",
  "cash_registers",
  "financial_movements",
  "profiles",
  "tenants",
  "tenant_members",
  "supply_price_history",
  "orders",
]);

function resolveTableName(collectionName: string) {
  const normalized = collectionName.replace(/^\/+|\/+$/g, "");
  if (TABLE_NAMES.has(normalized)) {
    return { table: normalized, filters: [] as Array<{ column: string; value: string }> };
  }

  const segments = normalized.split("/");
  if (segments[0] === "tenants" && segments.length >= 3) {
    const tenantId = segments[1];
    const collection = segments[2];

    if (collection === "supplies" && segments[4] === "price_history") {
      return {
        table: "supply_price_history",
        filters: [
          { column: "tenantId", value: tenantId },
          { column: "supplyId", value: segments[3] },
        ],
      };
    }

    if (collection === "cash_registers" && segments[4] === "financial_movements") {
      return {
        table: "financial_movements",
        filters: [
          { column: "tenantId", value: tenantId },
          { column: "cashRegisterId", value: segments[3] },
        ],
      };
    }

    return {
      table: collection,
      filters: [{ column: "tenantId", value: tenantId }],
    };
  }

  throw new Error(`Colecao nao suportada para Supabase: ${collectionName}`);
}

export const setDocumentActive = async (
  _SupabaseStore: unknown,
  collectionName: string,
  id: string,
  isActive: boolean
): Promise<void> => {
  const client = getSupabaseBrowserClient();
  const { table, filters } = resolveTableName(collectionName);

  let request = client.from(table).update({ isActive });
  for (const filter of filters) {
    request = request.eq(filter.column, filter.value);
  }
  request = request.eq("id", id);

  const { error } = await request;
  if (error) {
    throw error;
  }
};

export function serializeObject<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (isSupabaseTimestamp(obj)) {
    return obj.toDate().toISOString() as unknown as T;
  }

  if (isDateInstance(obj)) {
    return obj.toISOString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeObject(item)) as unknown as T;
  }

  const newObj = {} as { [key: string]: any };
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = serializeObject(obj[key as keyof T]);
    }
  }

  return newObj as T;
}
