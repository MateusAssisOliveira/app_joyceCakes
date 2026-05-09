"use client";

import type { ReactNode } from "react";
import { getAuth } from "@/supabase/compat/auth";
import { getSupabaseStore, type SupabaseStore } from "@/supabase/compat/SupabaseStore";
import { useCurrentUser } from "@/supabase";

type CompatApp = { name: string };

export interface SupabaseContextState {
  areServicesAvailable: boolean;
  SupabaseApp: CompatApp;
  SupabaseStore: SupabaseStore;
  auth: ReturnType<typeof getAuth>;
  user: ReturnType<typeof useCurrentUser>["user"];
  isUserLoading: boolean;
  userError: Error | null;
}

export interface SupabaseServicesAndUser extends SupabaseContextState {}

export interface UserHookResult {
  user: ReturnType<typeof useCurrentUser>["user"];
  isUserLoading: boolean;
  userError: Error | null;
}

const compatApp: CompatApp = { name: "supabase-compat-app" };

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useSupabase(): SupabaseServicesAndUser {
  const { user, isUserLoading, userError } = useCurrentUser();

  return {
    areServicesAvailable: true,
    SupabaseApp: compatApp,
    SupabaseStore: getSupabaseStore(),
    auth: getAuth(),
    user,
    isUserLoading,
    userError,
  };
}

export const useAuth = () => useSupabase().auth;
export const useSupabaseStore = (): SupabaseStore => useSupabase().SupabaseStore;
export const useSupabaseApp = (): CompatApp => useSupabase().SupabaseApp;
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useSupabase();
  return { user, isUserLoading, userError };
};
