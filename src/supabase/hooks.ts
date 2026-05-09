"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel, SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { useSupabase } from "./provider";

export type AppUser = {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  providerData: Array<{ providerId?: string; uid: string }>;
  tenantId: string | null;
  user_metadata?: Record<string, any>;
};

export type SupabaseFilter = {
  column: string;
  value: string | number | boolean | null;
};

type OrderBy = {
  column: string;
  ascending?: boolean;
};

type CollectionOptions = {
  enabled?: boolean;
  filters?: SupabaseFilter[];
  orderBy?: OrderBy;
  limit?: number;
  select?: string;
};

type DocumentOptions = {
  enabled?: boolean;
  filters?: SupabaseFilter[];
  idColumn?: string;
  select?: string;
};

type HookResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

function mapAppUser(user: SupabaseUser | null): AppUser | null {
  if (!user) return null;

  return {
    uid: user.id,
    id: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.name as string | undefined) ?? user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    phoneNumber: user.phone ?? null,
    providerData: [
      {
        providerId: (user.app_metadata?.provider as string | undefined) ?? "email",
        uid: user.id,
      },
    ],
    tenantId: null,
    user_metadata: user.user_metadata,
  };
}

function applyFilters(builder: any, filters: SupabaseFilter[] = []) {
  return filters.reduce((current, filter) => current.eq(filter.column, filter.value), builder);
}

async function fetchCollection<T>(
  client: SupabaseClient,
  table: string,
  options: CollectionOptions
): Promise<T[]> {
  let request = applyFilters(client.from(table).select(options.select ?? "*"), options.filters);

  if (options.orderBy) {
    request = request.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  if (typeof options.limit === "number") {
    request = request.limit(options.limit);
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as T[];
}

async function fetchDocument<T>(
  client: SupabaseClient,
  table: string,
  id: string,
  options: DocumentOptions
): Promise<T | null> {
  let request = applyFilters(client.from(table).select(options.select ?? "*"), options.filters);
  request = request.eq(options.idColumn ?? "id", id);

  const { data, error } = await request.maybeSingle();
  if (error) throw error;
  return (data as T | null) ?? null;
}

function useRealtimeReload(
  client: SupabaseClient,
  table: string,
  enabled: boolean,
  reload: () => Promise<void>
) {
  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let channel: RealtimeChannel | null = null;

    channel = client
      .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (active) {
          void reload();
        }
      })
      .subscribe();

    return () => {
      active = false;
      if (channel) {
        void client.removeChannel(channel);
      }
    };
  }, [client, enabled, reload, table]);
}

export function useCurrentUser() {
  const { user, isLoading, error } = useSupabase();

  return {
    user: useMemo(() => mapAppUser(user), [user]),
    isUserLoading: isLoading,
    userError: error,
  };
}

export function useSupabaseCollection<T = any>(
  table: string,
  options: CollectionOptions = {}
): HookResult<T[]> {
  const { client } = useSupabase();
  const { enabled: enabledOption, filters, orderBy, limit, select } = options;
  const enabled = enabledOption ?? true;
  const optionsKey = JSON.stringify({
    filters: filters ?? [],
    orderBy: orderBy ?? null,
    limit: limit ?? null,
    select: select ?? "*",
  });
  const stableOptions = useMemo<CollectionOptions>(
    () => ({ enabled, filters, orderBy, limit, select }),
    [enabled, filters, limit, orderBy, select]
  );

  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async () => {
      if (!enabled) {
        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const rows = await fetchCollection<T>(client, table, stableOptions);
        setData(rows);
        setError(null);
      } catch (err) {
        setData(null);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [client, enabled, stableOptions, table]
  );

  useEffect(() => {
    void load();
  }, [load, optionsKey]);

  useRealtimeReload(client, table, enabled, load);

  return { data, isLoading, error };
}

export function useSupabaseDocument<T = any>(
  table: string,
  id: string | null | undefined,
  options: DocumentOptions = {}
): HookResult<T> {
  const { client } = useSupabase();
  const { enabled: enabledOption, filters, idColumn, select } = options;
  const enabled = (enabledOption ?? true) && Boolean(id);
  const optionsKey = JSON.stringify({
    id,
    filters: filters ?? [],
    idColumn: idColumn ?? "id",
    select: select ?? "*",
  });
  const stableOptions = useMemo<DocumentOptions>(
    () => ({ enabled, filters, idColumn, select }),
    [enabled, filters, idColumn, select]
  );

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async () => {
      if (!enabled || !id) {
        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const row = await fetchDocument<T>(client, table, id, stableOptions);
        setData(row);
        setError(null);
      } catch (err) {
        setData(null);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [client, enabled, id, stableOptions, table]
  );

  useEffect(() => {
    void load();
  }, [load, optionsKey]);

  useRealtimeReload(client, table, enabled, load);

  return { data, isLoading, error };
}
