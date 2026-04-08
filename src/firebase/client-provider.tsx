'use client';

import React, { useEffect, useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getSdks } from '@/firebase';
import { initSyncClient } from '@/lib/sync-client';
import {
  createFirestoreClientSummaryGetter,
  createFirestoreTableDataGetter,
} from '@/lib/firestore-client-summary';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return getSdks();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    let isMounted = true;
    const parseNumber = (value: string | undefined, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    const divergenceStrategyEnv =
      process.env.NEXT_PUBLIC_SYNC_DIVERGENCE_STRATEGY;
    const syncServerEnv = process.env.NEXT_PUBLIC_SYNC_SERVER?.trim() || "";
    const hasSyncServer = syncServerEnv.length > 0;
    const divergenceStrategy =
      divergenceStrategyEnv === "none" ||
      divergenceStrategyEnv === "full_resync" ||
      divergenceStrategyEnv === "refresh_mismatched"
        ? divergenceStrategyEnv
        : "refresh_mismatched";
    const serverUrl = hasSyncServer ? syncServerEnv : 'http://localhost:4000';
    const configuredAutoSync = hasSyncServer && process.env.NEXT_PUBLIC_SYNC_AUTO !== 'false';
    const configuredAutoReconcile =
      hasSyncServer && process.env.NEXT_PUBLIC_SYNC_AUTO_RECONCILE === 'true';

    const setup = async () => {
      const activeTenantId =
        typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') || undefined : undefined;
      let canReachSyncServer = false;
      if (hasSyncServer) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          const healthResponse = await fetch(`${serverUrl}/health`, { signal: controller.signal });
          canReachSyncServer = healthResponse.ok;
        } catch {
          canReachSyncServer = false;
        } finally {
          clearTimeout(timeoutId);
        }
      }

      if (!isMounted) {
        return;
      }

      const syncClient = initSyncClient({
        serverUrl,
        tenantId: activeTenantId,
        syncApiKey: process.env.NEXT_PUBLIC_SYNC_API_KEY,
        autoBootstrap: process.env.NEXT_PUBLIC_SYNC_AUTO_BOOTSTRAP !== 'false',
        autoSync: configuredAutoSync && canReachSyncServer,
        syncInterval: parseNumber(process.env.NEXT_PUBLIC_SYNC_INTERVAL_MS, 5000),
        retryAttempts: parseNumber(process.env.NEXT_PUBLIC_SYNC_RETRY_ATTEMPTS, 3),
        retryBaseDelay: parseNumber(process.env.NEXT_PUBLIC_SYNC_RETRY_BASE_DELAY_MS, 500),
        retryMaxDelay: parseNumber(process.env.NEXT_PUBLIC_SYNC_RETRY_MAX_DELAY_MS, 5000),
        autoReconcile: configuredAutoReconcile && canReachSyncServer,
        reconcileInterval: parseNumber(process.env.NEXT_PUBLIC_SYNC_RECONCILE_INTERVAL_MS, 60000),
        getClientSummary: createFirestoreClientSummaryGetter(firebaseServices.firestore),
        getTableData: createFirestoreTableDataGetter(firebaseServices.firestore),
        divergenceStrategy,
      });

      if (hasSyncServer && !canReachSyncServer) {
        console.warn(`[sync] Servidor indisponível em ${serverUrl}. Auto-sync desativado nesta sessão.`);
      }

      return syncClient;
    };

    let syncClientRef: ReturnType<typeof initSyncClient> | null = null;
    setup().then((client) => {
      syncClientRef = client ?? null;
    });

    return () => {
      isMounted = false;
      syncClientRef?.stopAutoSync();
    };
  }, [firebaseServices.firestore]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
