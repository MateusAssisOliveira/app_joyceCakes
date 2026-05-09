// Camada de compatibilidade historica.
// O app mantem os mesmos hooks/exports antigos, mas a implementacao agora usa Supabase.

import { getAuth } from "@/supabase/compat/auth";
import { getSupabaseStore } from "@/supabase/compat/SupabaseStore";

const compatApp = { name: "supabase-compat-app" } as const;

export function getSdks() {
  return {
    SupabaseApp: compatApp,
    auth: getAuth(),
    SupabaseStore: getSupabaseStore(),
  };
}

export * from "./provider";
export * from "./client-provider";
export * from "./SupabaseStore/use-collection";
export * from "./SupabaseStore/use-doc";
export * from "./non-blocking-updates";
export * from "./errors";
export * from "./error-emitter";
