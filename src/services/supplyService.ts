import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toDate } from "@/lib/timestamp-utils";
import { getTenantCollectionPath, resolveTenantIdOrThrow } from "@/lib/tenant";
import type { CashRegister, InventoryMovement, PriceVariation, Supply } from "@/types";
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
  _SupabaseStore: unknown,
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

  const initialStock = Number(dataWithTimestamp.stock ?? 0);
  if (initialStock > 0) {
    const { error: movementError } = await client.from("inventory_movements").insert({
      tenantId: currentTenantId,
      item_type: "supply",
      supplyId: data.id,
      movement_type: "ADJUSTMENT",
      quantity_delta: initialStock,
      unit: dataWithTimestamp.unit,
      note: "Saldo inicial (cadastro)",
    });
    if (movementError) throw movementError;
  }

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
  _SupabaseStore: unknown,
  suppliesData: Omit<Supply, "id" | "createdAt" | "isActive">[],
  tenantId?: string
) {
  await Promise.all(suppliesData.map((supply) => addSupply(null, supply, undefined, tenantId)));
}

export async function updateSupply(
  _SupabaseStore: unknown,
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
  if (!oldData) throw new Error("Insumo não encontrado.");

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

  let stockDelta: number | undefined;
  if (Object.prototype.hasOwnProperty.call(sanitizedDataToUpdate, "stock")) {
    stockDelta = Number(sanitizedDataToUpdate.stock) - Number(oldData.stock);
  }

  const payloadWithoutStockMovement = { ...sanitizedDataToUpdate } as Record<string, unknown>;
  if (stockDelta !== undefined && stockDelta !== 0) {
    delete payloadWithoutStockMovement.stock;
  }

  if (stockDelta !== undefined && stockDelta !== 0) {
    const movementType = stockDelta > 0 ? "PURCHASE" : "ADJUSTMENT";
    const unitCostRaw =
      sanitizedDataToUpdate.costPerUnit !== undefined
        ? Number(sanitizedDataToUpdate.costPerUnit)
        : Number(oldData.costPerUnit);
    const { error: rpcError } = await client.rpc("apply_supply_inventory_movement", {
      p_tenant_id: currentTenantId,
      p_supply_id: id,
      p_quantity_delta: stockDelta,
      p_movement_type: movementType,
      p_note: null,
      p_unit_cost: movementType === "PURCHASE" && Number.isFinite(unitCostRaw) ? unitCostRaw : null,
    });
    if (rpcError) throw rpcError;
  }

  const keysLeft = Object.keys(payloadWithoutStockMovement).filter(
    (k) => payloadWithoutStockMovement[k] !== undefined
  );
  if (keysLeft.length > 0) {
    const { error } = await client
      .from("supplies")
      .update(payloadWithoutStockMovement)
      .eq("tenantId", currentTenantId)
      .eq("id", id);

    if (error) throw error;
  }

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

export async function inactivateSupply(_SupabaseStore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "supplies"), id, false);
}

export async function reactivateSupply(_SupabaseStore: unknown, id: string, tenantId?: string): Promise<void> {
  const currentTenantId = resolveTenantIdOrThrow(tenantId);
  await setDocumentActive(null, getTenantCollectionPath(currentTenantId, "supplies"), id, true);
}

export async function getSupplies(_SupabaseStore: unknown, tenantId?: string): Promise<Supply[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client.from("supplies").select("*").eq("tenantId", currentTenantId);
  if (error) throw error;

  return serializeObject((data ?? []) as Supply[]);
}

export async function getInventoryMovements(
  _SupabaseStore: unknown,
  tenantId?: string,
  opts?: { supplyId?: string; limit?: number }
): Promise<InventoryMovement[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  let req = client
    .from("inventory_movements")
    .select("*")
    .eq("tenantId", currentTenantId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 300);

  if (opts?.supplyId) {
    req = req.eq("supplyId", opts.supplyId);
  }

  const { data, error } = await req;
  if (error) throw error;

  return (data ?? []) as InventoryMovement[];
}

export async function getPriceHistory(
  _SupabaseStore: unknown,
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
