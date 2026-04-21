"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthState = {
  client: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

const SupabaseAuthContext = createContext<AuthState | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<Omit<AuthState, "client">>({
    session: null,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let ignore = false;

    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (ignore) return;
        if (error) throw error;
        setState({
          session: data.session,
          user: data.session?.user ?? null,
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (ignore) return;
        setState({ session: null, user: null, isLoading: false, error: err as Error });
      });

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (ignore) return;
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
        error: null,
      }));
    });

    return () => {
      ignore = true;
      subscription.subscription.unsubscribe();
    };
  }, [client]);

  const value: AuthState = useMemo(
    () => ({
      client,
      session: state.session,
      user: state.user,
      isLoading: state.isLoading,
      error: state.error,
    }),
    [client, state]
  );

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabase() {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return ctx;
}

