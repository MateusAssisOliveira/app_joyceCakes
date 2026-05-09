import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductCsvImportRow } from "@/lib/product-csv";
import { normalizeStockUnitType } from "@/lib/stock-units";
import { getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";
import type { Product } from "@/types";
import { serializeObject, setDocumentActive } from "./utils";

export async function addProduct(
  _SupabaseStore: unknown,
  productData: Partial<Omit<Product, "id" | "createdAt" | "isActive">>,
  tenantId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { error } = await client.from("products").insert({
    ...productData,
    tenantId: currentTenantId,
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function updateProduct(
  _SupabaseStore: unknown,
  id: string,
  updatedData: Partial<Omit<Product, "id" | "createdAt" | "isActive">>,
  tenantId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { error } = await client
    .from("products")
    .update(updatedData)
    .eq("tenantId", currentTenantId)
    .eq("id", id);

  if (error) throw error;
}

export async function inactivateProduct(_SupabaseStore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "products"), id, false);
}

export async function reactivateProduct(_SupabaseStore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "products"), id, true);
}

export async function getProducts(_SupabaseStore: unknown, tenantId?: string): Promise<Product[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client.from("products").select("*").eq("tenantId", currentTenantId);
  if (error) throw error;

  return serializeObject((data ?? []) as Product[]);
}

function resolveImportRowId(row: ProductCsvImportRow): string {
  if (row.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id)) {
    return row.id;
  }
  return crypto.randomUUID();
}

type ProductUpsertPayload = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  imageUrlId: string;
  stock_quantity: number;
  unit_type: NonNullable<Product["unit_type"]>;
  display_unit: Product["display_unit"];
  isActive: boolean;
  preparationTime: number | null;
  laborCost: number;
  fixedCost: number;
  components: unknown[] | null;
};

const IMPORT_CHUNK = 40;

/** Importação em massa: insere IDs novos e atualiza os que já existem no tenant (sem alterar outras lojas). */
export async function bulkImportProducts(
  rows: ProductCsvImportRow[],
  tenantId?: string
): Promise<{ inserted: number; updated: number }> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data: existingRows, error: fetchError } = await client
    .from("products")
    .select("id")
    .eq("tenantId", currentTenantId);
  if (fetchError) throw fetchError;

  const existingIds = new Set((existingRows ?? []).map((r: { id: string }) => r.id));

  const resolved = new Map<string, ProductCsvImportRow & { resolvedId: string }>();
  for (const row of rows) {
    const resolvedId = resolveImportRowId(row);
    resolved.set(resolvedId, { ...row, resolvedId });
  }

  const payloads: ProductUpsertPayload[] = [...resolved.values()].map((row) => ({
    id: row.resolvedId,
    tenantId: currentTenantId,
    name: row.name,
    description: row.description,
    price: row.price,
    costPrice: row.costPrice,
    category: row.category,
    imageUrlId: row.imageUrlId,
    stock_quantity: row.stock_quantity,
    unit_type: normalizeStockUnitType(row.unit_type),
    display_unit: row.display_unit ?? null,
    isActive: row.isActive,
    preparationTime: row.preparationTime,
    laborCost: row.laborCost,
    fixedCost: row.fixedCost,
    components: row.components,
  }));

  const toInsert = payloads.filter((p) => !existingIds.has(p.id));
  const toUpdate = payloads.filter((p) => existingIds.has(p.id));

  for (let i = 0; i < toInsert.length; i += IMPORT_CHUNK) {
    const chunk = toInsert.slice(i, i + IMPORT_CHUNK).map((p) => ({
      ...p,
      createdAt: new Date().toISOString(),
    }));
    const { error } = await client.from("products").insert(chunk);
    if (error) throw error;
  }

  for (let i = 0; i < toUpdate.length; i += IMPORT_CHUNK) {
    const chunk = toUpdate.slice(i, i + IMPORT_CHUNK);
    const results = await Promise.all(
      chunk.map(({ id, tenantId, ...rest }) => {
        void tenantId;
        return client.from("products").update(rest).eq("tenantId", currentTenantId).eq("id", id);
      })
    );
    const firstErr = results.find((r) => r.error)?.error;
    if (firstErr) throw firstErr;
  }

  return { inserted: toInsert.length, updated: toUpdate.length };
}
