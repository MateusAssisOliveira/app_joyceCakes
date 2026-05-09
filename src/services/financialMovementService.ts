import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveTenantIdOrThrow } from "@/lib/tenant";
import type { CashRegister, FinancialMovement } from "@/types";
import { updateUserProfile } from "./userService";
import { serializeObject } from "./utils";

export async function getCashRegisterById(
  _SupabaseStore: unknown,
  registerId: string,
  tenantId?: string
): Promise<CashRegister | null> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client
    .from("cash_registers")
    .select("*")
    .eq("tenantId", currentTenantId)
    .eq("id", registerId)
    .maybeSingle();

  if (error) throw error;
  return data ? serializeObject(data as CashRegister) : null;
}

export async function getFinancialMovements(
  _SupabaseStore: unknown,
  cashRegisterId: string,
  tenantId?: string
): Promise<FinancialMovement[]> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId);

  const { data, error } = await client
    .from("financial_movements")
    .select("*")
    .eq("tenantId", currentTenantId)
    .eq("cashRegisterId", cashRegisterId)
    .order("movementDate", { ascending: false });

  if (error) throw error;
  return serializeObject((data ?? []) as FinancialMovement[]);
}

export async function openCashRegister(
  SupabaseStore: unknown,
  userId: string,
  initialBalance: number,
  tenantId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId || userId);

  const { data: openRows, error: queryError } = await client
    .from("cash_registers")
    .select("id")
    .eq("tenantId", currentTenantId)
    .eq("status", "open")
    .limit(1);

  if (queryError) throw queryError;
  if ((openRows ?? []).length > 0) {
    throw new Error("Ja existe um caixa aberto para este tenant.");
  }

  const { data, error } = await client
    .from("cash_registers")
    .insert({
      userId,
      tenantId: currentTenantId,
      initialBalance,
      openingDate: new Date().toISOString(),
      status: "open",
      closingDate: null,
      finalBalance: null,
      totalSales: 0,
      totalExpenses: 0,
    })
    .select("id")
    .single();

  if (error) throw error;

  await updateUserProfile(SupabaseStore, userId, {
    activeCashRegisterId: data.id,
    activeTenantId: currentTenantId,
  });
}

export async function closeCashRegister(
  SupabaseStore: unknown,
  userId: string,
  registerId: string,
  finalBalance: number,
  tenantId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId || userId);

  const { error } = await client
    .from("cash_registers")
    .update({
      status: "closed",
      closingDate: new Date().toISOString(),
      finalBalance,
    })
    .eq("tenantId", currentTenantId)
    .eq("id", registerId);

  if (error) throw error;

  await updateUserProfile(SupabaseStore, userId, {
    activeCashRegisterId: null,
    activeTenantId: currentTenantId,
  });
}

export async function addFinancialMovement(
  _SupabaseStore: unknown,
  cashRegister: CashRegister,
  movementData: Omit<FinancialMovement, "id" | "movementDate" | "cashRegisterId">,
  tenantId?: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const currentTenantId = resolveTenantIdOrThrow(tenantId || cashRegister.userId);

  const { error } = await client.from("financial_movements").insert({
    ...movementData,
    cashRegisterId: cashRegister.id,
    tenantId: currentTenantId,
    movementDate: new Date().toISOString(),
  });

  if (error) throw error;
}
