
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseClientProvider, useUser } from '@/firebase';
import AdminPanel from '@/app/admin/admin-panel'; // CORRIGIDO: Importando do local certo.
import { Loader } from 'lucide-react';

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, redireciona para o login.
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  // Enquanto o estado de autenticação está sendo verificado, exibe um loader.
  if (isUserLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-50">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-semibold">Verificando autorização...</p>
      </div>
    );
  }

  // Se o usuário estiver logado, renderiza o painel de administração.
  if (user) {
    return (
      <AdminPanel>
        {children}
      </AdminPanel>
    );
  }

  // Se não estiver carregando e não houver usuário, retorna null (ou um loader)
  // enquanto o redirecionamento acontece.
  return null;
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <ProtectedAdminLayout>
        {children}
      </ProtectedAdminLayout>
    </FirebaseClientProvider>
  );
}
