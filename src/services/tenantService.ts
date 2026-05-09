import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type BootstrapUser = {
  uid?: string;
  id?: string;
  displayName?: string | null;
  email?: string | null;
};

export async function ensureTenantBootstrap(_SupabaseStore: unknown, user: BootstrapUser): Promise<void> {
  const client = getSupabaseBrowserClient();
  const userId = user.uid ?? user.id;

  if (!userId) {
    throw new Error("Usuario nao identificado para bootstrap do tenant.");
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "Minha Confeitaria";

  const { error: tenantError } = await client.from("tenants").upsert(
    {
      id: userId,
      name: displayName,
      owner_user_id: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (tenantError) throw tenantError;

  const { error: memberError } = await client.from("tenant_members").upsert(
    {
      tenantId: userId,
      userId,
      role: "owner",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { onConflict: "tenantId,userId", ignoreDuplicates: false }
  );
  if (memberError) throw memberError;

  const { error: profileError } = await client.from("profiles").upsert(
    {
      user_id: userId,
      email: user.email || "",
      name: user.displayName || "",
      active_tenant_id: userId,
    },
    { onConflict: "user_id", ignoreDuplicates: false }
  );
  if (profileError) throw profileError;
}
