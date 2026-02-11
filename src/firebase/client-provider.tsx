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
    const parseNumber = (value: string | undefined, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    const divergenceStrategyEnv =
      process.env.NEXT_PUBLIC_SYNC_DIVERGENCE_STRATEGY;
    const divergenceStrategy =
      divergenceStrategyEnv === "none" ||
      divergenceStrategyEnv === "full_resync" ||
      divergenceStrategyEnv === "refresh_mismatched"
        ? divergenceStrategyEnv
        : "refresh_mismatched";

    const syncClient = initSyncClient({
      serverUrl: process.env.NEXT_PUBLIC_SYNC_SERVER || 'http://localhost:4000',
      syncApiKey: process.env.NEXT_PUBLIC_SYNC_API_KEY,
      autoBootstrap: process.env.NEXT_PUBLIC_SYNC_AUTO_BOOTSTRAP !== 'false',
      autoSync: process.env.NEXT_PUBLIC_SYNC_AUTO !== 'false',
      syncInterval: parseNumber(process.env.NEXT_PUBLIC_SYNC_INTERVAL_MS, 5000),
      retryAttempts: parseNumber(process.env.NEXT_PUBLIC_SYNC_RETRY_ATTEMPTS, 3),
      retryBaseDelay: parseNumber(process.env.NEXT_PUBLIC_SYNC_RETRY_BASE_DELAY_MS, 500),
      retryMaxDelay: parseNumber(process.env.NEXT_PUBLIC_SYNC_RETRY_MAX_DELAY_MS, 5000),
      autoReconcile: process.env.NEXT_PUBLIC_SYNC_AUTO_RECONCILE === 'true',
      reconcileInterval: parseNumber(process.env.NEXT_PUBLIC_SYNC_RECONCILE_INTERVAL_MS, 60000),
      getClientSummary: createFirestoreClientSummaryGetter(firebaseServices.firestore),
      getTableData: createFirestoreTableDataGetter(firebaseServices.firestore),
      divergenceStrategy,
    });

    return () => {
      syncClient.stopAutoSync();
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
