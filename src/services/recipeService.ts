import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";
import type { TechnicalSheet } from "@/types";
import { serializeObject, setDocumentActive } from "./utils";

export async function addTechnicalSheet(
  _firestore: unknown,
  sheetData: Omit<TechnicalSheet, "id" | "createdAt" | "isActive">,
  tenantId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { error } = await client.from("technical_sheets").insert({
    ...sheetData,
    tenantId: currentTenantId,
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function updateTechnicalSheet(
  _firestore: unknown,
  id: string,
  updatedData: Partial<Omit<TechnicalSheet, "id" | "createdAt" | "isActive">>,
  tenantId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { error } = await client
    .from("technical_sheets")
    .update(updatedData)
    .eq("tenantId", currentTenantId)
    .eq("id", id);

  if (error) throw error;
}

export async function inactivateTechnicalSheet(
  _firestore: unknown,
  id: string,
  tenantId?: string
): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "technical_sheets"), id, false);
}

export async function reactivateTechnicalSheet(
  _firestore: unknown,
  id: string,
  tenantId?: string
): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "technical_sheets"), id, true);
}

export async function getTechnicalSheets(_firestore: unknown, tenantId?: string): Promise<TechnicalSheet[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client
    .from("technical_sheets")
    .select("*")
    .eq("tenantId", currentTenantId);

  if (error) throw error;

  return serializeObject((data ?? []) as TechnicalSheet[]);
}
