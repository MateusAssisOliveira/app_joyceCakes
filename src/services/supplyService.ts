import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toDate } from "@/lib/timestamp-utils";
import { getSupplyPriceHistoryPath, getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";
import type { CashRegister, PriceVariation, Supply } from "@/types";
import { addFinancialMovement } from "./financialMovementService";
import { serializeObject, setDocumentActive } from "./utils";

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

async function findOpenCashRegister(tenantId: string): Promise<CashRegister | null> {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client
    .from("cash_registers")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CashRegister | null) ?? null;
}

async function addPriceHistoryEntry(
  tenantId: string,
  supplyId: string,
  cost: number,
  supplier?: string
) {
  const client = getSupabaseBrowserClient();
  const { error } = await client.from("supply_price_history").insert({
    tenantId,
    supplyId,
    date: new Date().toISOString(),
    costPerUnit: cost,
    supplier: supplier || "",
  });

  if (error) throw error;
}

export async function addSupply(
  _firestore: unknown,
  supplyData: Omit<Supply, "id" | "createdAt" | "isActive">,
  financialData?: FinancialRegistrationData,
  tenantId?: string
) {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId || financialData?.tenantId || financialData?.userId);

  const dataWithTimestamp = stripUndefinedFields({
    ...supplyData,
    tenantId: currentTenantId,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastPurchaseDate: toDate(supplyData.lastPurchaseDate)?.toISOString() ?? new Date().toISOString(),
    expirationDate: toDate(supplyData.expirationDate)?.toISOString() ?? undefined,
    packageCost: supplyData.packageCost ?? undefined,
    packageQuantity: supplyData.packageQuantity ?? undefined,
  });

  const { data, error } = await client
    .from("supplies")
    .insert(dataWithTimestamp)
    .select("id")
    .single();

  if (error) throw error;

  await addPriceHistoryEntry(currentTenantId, data.id, dataWithTimestamp.costPerUnit, dataWithTimestamp.supplier);

  if (financialData?.shouldRegister && financialData.amount > 0) {
    const activeCashRegister = await findOpenCashRegister(currentTenantId);
    if (!activeCashRegister) {
      console.warn("Nenhum caixa aberto. A despesa da compra nao foi registrada.");
      return data;
    }

    await addFinancialMovement(
      null,
      activeCashRegister,
      {
        type: "expense",
        amount: financialData.amount,
        category: "Compra de Insumos",
        description: financialData.description || `Compra de ${supplyData.name}`,
        paymentMethod: financialData.paymentMethod,
      },
      currentTenantId
    );
  }

  return data;
}

export async function addSuppliesInBatch(
  _firestore: unknown,
  suppliesData: Omit<Supply, "id" | "createdAt" | "isActive">[],
  tenantId?: string
) {
  await Promise.all(suppliesData.map((supply) => addSupply(null, supply, undefined, tenantId)));
}

export async function updateSupply(
  _firestore: unknown,
  id: string,
  updatedData: Partial<Omit<Supply, "id" | "createdAt" | "isActive">>,
  financialData?: FinancialRegistrationData,
  tenantId?: string
) {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId || financialData?.tenantId || financialData?.userId);

  const { data: oldData, error: loadError } = await client
    .from("supplies")
    .select("*")
    .eq("tenantId", currentTenantId)
    .eq("id", id)
    .maybeSingle();

  if (loadError) throw loadError;

  const sanitizedDataToUpdate = stripUndefinedFields({
    ...updatedData,
    lastPurchaseDate:
      updatedData.lastPurchaseDate === undefined
        ? null
        : toDate(updatedData.lastPurchaseDate)?.toISOString() ?? null,
    expirationDate:
      updatedData.expirationDate === undefined
        ? null
        : toDate(updatedData.expirationDate)?.toISOString() ?? null,
    packageCost: updatedData.packageCost ?? null,
    packageQuantity: updatedData.packageQuantity ?? null,
  });

  const { error } = await client
    .from("supplies")
    .update(sanitizedDataToUpdate)
    .eq("tenantId", currentTenantId)
    .eq("id", id);

  if (error) throw error;

  if (oldData && oldData.costPerUnit !== sanitizedDataToUpdate.costPerUnit && sanitizedDataToUpdate.costPerUnit) {
    await addPriceHistoryEntry(
      currentTenantId,
      id,
      sanitizedDataToUpdate.costPerUnit,
      sanitizedDataToUpdate.supplier
    );
  }

  if (financialData?.shouldRegister && financialData.amount > 0) {
    const activeCashRegister = await findOpenCashRegister(currentTenantId);
    if (!activeCashRegister) {
      console.warn("Nenhum caixa aberto. A despesa da compra nao foi registrada.");
      return;
    }

    await addFinancialMovement(
      null,
      activeCashRegister,
      {
        type: "expense",
        amount: financialData.amount,
        category: "Compra de Insumos",
        description: financialData.description || `Compra de ${sanitizedDataToUpdate.name}`,
        paymentMethod: financialData.paymentMethod,
      },
      currentTenantId
    );
  }
}

export async function inactivateSupply(_firestore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "supplies"), id, false);
}

export async function reactivateSupply(_firestore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "supplies"), id, true);
}

export async function getSupplies(_firestore: unknown, tenantId?: string): Promise<Supply[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client.from("supplies").select("*").eq("tenantId", currentTenantId);
  if (error) throw error;

  return serializeObject((data ?? []) as Supply[]);
}

export async function getPriceHistory(
  _firestore: unknown,
  supplyId: string,
  tenantId?: string
): Promise<PriceVariation[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client
    .from("supply_price_history")
    .select("*")
    .eq("tenantId", currentTenantId)
    .eq("supplyId", supplyId)
    .order("date", { ascending: false });

  if (error) throw error;

  return (data ?? []) as PriceVariation[];
}
