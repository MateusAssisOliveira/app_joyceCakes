import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tenant, TenantMember, TenantRole } from "@/types";
import { updateUserProfile } from "./userService";

type TenantUser = {
  uid?: string;
  id?: string;
};

export async function createTenant(
  SupabaseStore: unknown,
  user: TenantUser,
  tenantName: string
): Promise<string> {
  const client = getSupabaseBrowserClient();
  const userId = user.uid ?? user.id;

  if (!userId) {
    throw new Error("Usuario nao identificado para criar tenant.");
  }

  const { data: tenant, error: tenantError } = await client
    .from("tenants")
    .insert({
      name: tenantName,
      owner_user_id: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (tenantError) throw tenantError;

  const { error: memberError } = await client.from("tenant_members").insert({
    tenantId: tenant.id,
    userId,
    role: "owner",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if (memberError) throw memberError;

  await updateUserProfile(SupabaseStore, userId, { activeTenantId: tenant.id });

  return tenant.id;
}

export async function switchActiveTenant(
  SupabaseStore: unknown,
  userId: string,
  tenantId: string
): Promise<void> {
  await updateUserProfile(SupabaseStore, userId, { activeTenantId: tenantId });
}

export async function inviteTenantMemberByUid(
  _SupabaseStore: unknown,
  tenantId: string,
  targetUserId: string,
  role: TenantRole
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const { error } = await client.from("tenant_members").upsert(
    {
      tenantId,
      userId: targetUserId,
      role,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { onConflict: "tenantId,userId", ignoreDuplicates: false }
  );

  if (error) throw error;
}

export async function listUserTenants(_SupabaseStore: unknown, userId: string): Promise<Tenant[]> {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client
    .from("tenant_members")
    .select('role,status,tenants!inner(id,name,owner_user_id,"createdAt","updatedAt")')
    .eq("userId", userId)
    .eq("status", "active");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.tenants.id,
    name: row.tenants.name,
    ownerUserId: row.tenants.owner_user_id,
    createdAt: row.tenants.createdAt,
    updatedAt: row.tenants.updatedAt,
  }));
}

export async function getTenantMembers(_SupabaseStore: unknown, tenantId: string): Promise<TenantMember[]> {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client
    .from("tenant_members")
    .select("*")
    .eq("tenantId", tenantId);

  if (error) throw error;

  return (data ?? []).map((member: any) => ({
    id: member.userId,
    userId: member.userId,
    role: member.role,
    status: member.status,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  }));
}
