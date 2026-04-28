'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SupabaseProvider, useSupabase } from '@/supabase';
import AdminPanel from '@/app/admin/admin-panel';
import { Loader } from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase';

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-50">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-semibold">
          Verificando autorizacao...
        </p>
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
    <SupabaseProvider>
      <FirebaseClientProvider>
        <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
      </FirebaseClientProvider>
    </SupabaseProvider>
  );
}
