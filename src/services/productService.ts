import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";
import type { Product } from "@/types";
import { serializeObject, setDocumentActive } from "./utils";

export async function addProduct(
  _firestore: unknown,
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
  _firestore: unknown,
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

export async function inactivateProduct(_firestore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "products"), id, false);
}

export async function reactivateProduct(_firestore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "products"), id, true);
}

export async function getProducts(_firestore: unknown, tenantId?: string): Promise<Product[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client.from("products").select("*").eq("tenantId", currentTenantId);
  if (error) throw error;

  return serializeObject((data ?? []) as Product[]);
}
