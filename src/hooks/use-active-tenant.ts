'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/supabase';
import type { UserProfile } from '@/types';

export function useActiveTenant() {
  const { client, user, isLoading: isUserLoading } = useSupabase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasTriedBackfill, setHasTriedBackfill] = useState(false);

  const userId = user?.id ?? null;

  const activeTenantId = useMemo(() => {
    const fromProfile = userProfile?.activeTenantId;
    if (fromProfile && fromProfile.trim().length > 0) return fromProfile;
    return null;
  }, [userProfile]);

  useEffect(() => {
    let ignore = false;

    if (!userId || !user) {
      setUserProfile(null);
      return;
    }

    const safeUser = user;

    (async () => {
      setIsProfileLoading(true);
      try {
        const { data, error } = await client
          .from('profiles')
          .select('user_id,email,name,active_tenant_id,active_cash_register_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (ignore) return;
        if (error) throw error;

        if (!data) {
          if (!hasTriedBackfill) {
            setHasTriedBackfill(true);
            try {
              await client.rpc("ensure_profile_and_tenant");
              const retry = await client
                .from("profiles")
                .select("user_id,email,name,active_tenant_id,active_cash_register_id")
                .eq("user_id", userId)
                .maybeSingle();
              if (!retry.error && retry.data) {
                setUserProfile({
                  id: retry.data.user_id,
                  email: retry.data.email ?? safeUser.email ?? "",
                  name: retry.data.name ?? safeUser.user_metadata?.name ?? "",
                  activeTenantId: retry.data.active_tenant_id ?? null,
                  activeCashRegisterId: retry.data.active_cash_register_id ?? null,
                });
                return;
              }
            } catch (err) {
              console.error("Falha ao rodar backfill de profile/tenant:", err);
            }
          }

          setUserProfile({
            id: userId,
            email: safeUser.email ?? '',
            name: safeUser.user_metadata?.name ?? '',
            activeTenantId: null,
            activeCashRegisterId: null,
          });
          return;
        }

        setUserProfile({
          id: data.user_id,
          email: data.email ?? safeUser.email ?? '',
          name: data.name ?? safeUser.user_metadata?.name ?? '',
          activeTenantId: data.active_tenant_id ?? null,
          activeCashRegisterId: data.active_cash_register_id ?? null,
        });
      } catch (err: unknown) {
        if (ignore) return;
        console.error('Falha ao carregar profile do Supabase:', err);
        setUserProfile({
          id: userId,
          email: safeUser.email ?? '',
          name: safeUser.user_metadata?.name ?? '',
          activeTenantId: null,
          activeCashRegisterId: null,
        });
      } finally {
        if (ignore) return;
        setIsProfileLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [client, user, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeTenantId) {
      window.localStorage.setItem('activeTenantId', activeTenantId);
    }
  }, [activeTenantId]);

  return {
    activeTenantId,
    userProfile,
    isLoading: isUserLoading || isProfileLoading,
  };
}
