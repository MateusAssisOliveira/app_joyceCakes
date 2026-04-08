import { getAuth } from "firebase/auth";

export type TenantScopedCollection =
  | "products"
  | "supplies"
  | "technical_sheets"
  | "financial_categories"
  | "orders"
  | "cash_registers";

export const resolveTenantId = (tenantId?: string | null): string | null => {
  const normalized = tenantId?.trim();
  if (normalized) return normalized;

  try {
    return getAuth().currentUser?.uid ?? null;
  } catch {
    return null;
  }
};

export const resolveTenantIdOrThrow = (tenantId?: string | null): string => {
  const resolved = resolveTenantId(tenantId);
  if (!resolved) {
    throw new Error("Tenant nao identificado. Faca login novamente.");
  }
  return resolved;
};

export const getTenantCollectionPath = (
  tenantId: string,
  collectionName: TenantScopedCollection
): string => `tenants/${tenantId}/${collectionName}`;

export const getSupplyPriceHistoryPath = (tenantId: string, supplyId: string): string =>
  `tenants/${tenantId}/supplies/${supplyId}/price_history`;

export const getTenantMemberPath = (tenantId: string, userId: string): string =>
  `tenants/${tenantId}/members/${userId}`;
