
'use client';

import { useMemo } from 'react';
import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import type { CashRegister, FinancialMovement, UserProfile, Product } from '@/types';
import { OpenCashRegisterDialog } from '@/components/admin/cash-flow/open-cash-register-dialog';
import { AddMovementDialog } from '@/components/admin/cash-flow/add-movement-dialog';
import { CashFlowHeader } from '@/components/admin/cash-flow/cash-flow-header';
import { CashFlowMetrics } from '@/components/admin/cash-flow/cash-flow-metrics';
import { RecentMovementsTable } from '@/components/admin/cash-flow/recent-movements-table';
import { Loader } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getTenantCollectionPath } from '@/lib/tenant';

export function CashFlowClient() {
  const firestore = useFirestore();
  const { user } = useUser(); // O layout já protege, então user não será nulo aqui.

  // 1. Busca o documento de perfil do usuário para obter o ID do caixa ativo
  const userProfileRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const tenantId = userProfile?.activeTenantId || user?.uid || null;

  // 2. Com o ID obtido, faz um 'get' direto no documento do caixa ativo
  const activeCashRegisterRef = useMemo(() => {
    if (!firestore || !tenantId || !userProfile?.activeCashRegisterId) return null;
    return doc(firestore, getTenantCollectionPath(tenantId, "cash_registers"), userProfile.activeCashRegisterId);
  }, [firestore, tenantId, userProfile]);

  const { data: activeCashRegister, isLoading: isRegisterLoading } = useDoc<CashRegister>(activeCashRegisterRef);
  
  // 3. Busca as movimentações do caixa ativo
  const movementsQuery = useMemo(() => {
    if (!firestore || !tenantId || !activeCashRegister) return null;
    return collection(
      firestore,
      `${getTenantCollectionPath(tenantId, "cash_registers")}/${activeCashRegister.id}/financial_movements`
    );
  }, [firestore, tenantId, activeCashRegister]);

  const { data: movements, isLoading: areMovementsLoading } = useCollection<FinancialMovement>(movementsQuery);
  
  // 4. Busca os produtos para o diálogo de nova movimentação
  const productsQuery = useMemo(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, getTenantCollectionPath(tenantId, "products")));
  }, [firestore, tenantId]);
  
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);
  
  const metrics = useMemo(() => {
    if (!activeCashRegister || !movements) {
      return {
        initialBalance: activeCashRegister?.initialBalance || 0,
        totalIncome: 0,
        totalExpenses: 0,
        finalBalance: activeCashRegister?.initialBalance || 0,
      };
    }

    const totalIncome = movements
      .filter((m) => m.type === 'income')
      .reduce((acc, m) => acc + m.amount, 0);
    
    const totalExpenses = movements
      .filter((m) => m.type === 'expense')
      .reduce((acc, m) => acc + m.amount, 0);

    const finalBalance = activeCashRegister.initialBalance + totalIncome - totalExpenses;

    return {
      initialBalance: activeCashRegister.initialBalance,
      totalIncome,
      totalExpenses,
      finalBalance,
    };
  }, [activeCashRegister, movements]);

  // A verificação de loading principal é feita no layout
  if (isProfileLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }
  
  // Se não está carregando o perfil, mas não tem caixa ativo, mostra o diálogo para abrir um.
  if (!activeCashRegister && !isRegisterLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <OpenCashRegisterDialog user={user} />
      </div>
    );
  }
  
  // Se tem um caixa, mas está carregando os dados dele ou as movimentações.
  if (isRegisterLoading || areMovementsLoading || areProductsLoading) {
     return (
        <div className="flex flex-1 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
           <p className="ml-2 text-muted-foreground">Carregando dados do caixa...</p>
        </div>
      );
  }
  
  // Se chegou aqui, mas ainda não tem o caixa (caso raro).
  if (!activeCashRegister) {
      return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Não foi possível carregar os dados do caixa.</p>
      </div>
    );
  }

  const activeProducts = products?.filter(p => p.isActive !== false) || [];

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6">
      <CashFlowHeader register={activeCashRegister} finalBalance={metrics.finalBalance} />
      <CashFlowMetrics metrics={metrics} />
      <Card>
        <CardContent className="px-3 pb-3 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="mb-4 flex justify-stretch sm:justify-end">
             <AddMovementDialog cashRegister={activeCashRegister} products={activeProducts} />
          </div>
          <RecentMovementsTable movements={movements || []} />
        </CardContent>
      </Card>
    </div>
  );
}
