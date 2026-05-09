import { createClient } from "@supabase/supabase-js";
import { AUTH_STORAGE_KEY } from "./auth-storage";

function requirePublicEnv(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function encodeCookieValue(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeCookieValue(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return decodeURIComponent(escape(atob(padded)));
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!cookie) return null;
  try {
    return decodeCookieValue(cookie.slice(prefix.length));
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const encoded = encodeCookieValue(value);
  document.cookie = `${name}=${encoded}; Path=/; Max-Age=604800; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
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
      storageKey: AUTH_STORAGE_KEY,
      storage: {
        getItem: (key) => {
          if (typeof window === "undefined") return null;
          return window.localStorage.getItem(key) ?? getCookie(key);
        },
        setItem: (key, value) => {
          if (typeof window === "undefined") return;
          window.localStorage.setItem(key, value);
          if (key === AUTH_STORAGE_KEY) {
            setCookie(key, value);
          }
        },
        removeItem: (key) => {
          if (typeof window === "undefined") return;
          window.localStorage.removeItem(key);
          if (key === AUTH_STORAGE_KEY) {
            removeCookie(key);
          }
        },
      },
    },
  });
}


