'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseClientProvider, useFirestore, useUser } from '@/firebase';
import { ensureTenantBootstrap } from '@/services';
import AdminPanel from '@/app/admin/admin-panel';
import { Loader } from 'lucide-react';

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const hasBootstrappedTenant = useRef(false);
  const [isTenantBootstrapLoading, setIsTenantBootstrapLoading] = React.useState(false);
  const [tenantBootstrapError, setTenantBootstrapError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!user || hasBootstrappedTenant.current) return;

    hasBootstrappedTenant.current = true;
    setIsTenantBootstrapLoading(true);
    setTenantBootstrapError(null);
    ensureTenantBootstrap(firestore, user).catch((error) => {
      console.error('Falha ao inicializar tenant:', error);
      setTenantBootstrapError(error instanceof Error ? error.message : 'Falha ao inicializar tenant');
      hasBootstrappedTenant.current = false;
    }).finally(() => {
      setIsTenantBootstrapLoading(false);
    });
  }, [firestore, user]);

  if (isUserLoading || isTenantBootstrapLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-50">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-semibold">
          {isUserLoading ? 'Verificando autorizacao...' : 'Inicializando tenant...'}
        </p>
      </div>
    );
  }

  if (tenantBootstrapError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-50 p-6 text-center">
        <p className="text-lg font-semibold">Erro ao inicializar tenant</p>
        <p className="text-sm text-muted-foreground">{tenantBootstrapError}</p>
      </div>
    );
  }

  if (user) {
    return <AdminPanel>{children}</AdminPanel>;
  }

  return null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
    </FirebaseClientProvider>
  );
}
