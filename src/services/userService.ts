import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";

export async function updateUserProfile(
  _firestore: unknown,
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const payload: Record<string, any> = {};

  if (data.email !== undefined) payload.email = data.email;
  if (data.name !== undefined) payload.name = data.name;
  if (data.activeTenantId !== undefined) payload.active_tenant_id = data.activeTenantId;
  if (data.activeCashRegisterId !== undefined) {
    payload.active_cash_register_id = data.activeCashRegisterId;
  }

  const { error } = await client.from("profiles").upsert(
    {
      user_id: userId,
      ...payload,
    },
    { onConflict: "user_id", ignoreDuplicates: false }
  );

  if (error) {
    throw error;
  }
}
