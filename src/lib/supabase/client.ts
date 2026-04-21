import { createClient } from "@supabase/supabase-js";

function requirePublicEnv(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export function getSupabaseBrowserClient() {
  // Next.js only inlines NEXT_PUBLIC_* when accessed directly (not via process.env[name]).
  const supabaseUrl = requirePublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  );
  const supabaseAnonKey = requirePublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

