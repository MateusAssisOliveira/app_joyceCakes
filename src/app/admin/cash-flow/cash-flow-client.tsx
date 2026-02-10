
'use client';

import { useState, useMemo } from 'react';
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

export function CashFlowClient() {
  const firestore = useFirestore();
  const { user } = useUser(); // O layout já protege, então user não será nulo aqui.

  // 1. Busca o documento de perfil do usuário para obter o ID do caixa ativo
  const userProfileRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // 2. Com o ID obtido, faz um 'get' direto no documento do caixa ativo
  const activeCashRegisterRef = useMemo(() => {
    if (!firestore || !user?.uid || !userProfile?.activeCashRegisterId) return null;
    return doc(firestore, `users/${user.uid}/cash_registers`, userProfile.activeCashRegisterId);
  }, [firestore, user, userProfile]);

  const { data: activeCashRegister, isLoading: isRegisterLoading } = useDoc<CashRegister>(activeCashRegisterRef);
  
  // 3. Busca as movimentações do caixa ativo
  const movementsQuery = useMemo(() => {
    if (!firestore || !user?.uid || !activeCashRegister) return null;
    return collection(firestore, `users/${user.uid}/cash_registers/${activeCashRegister.id}/financial_movements`);
  }, [firestore, user, activeCashRegister]);

  const { data: movements, isLoading: areMovementsLoading } = useCollection<FinancialMovement>(movementsQuery);
  
  // 4. Busca os produtos para o diálogo de nova movimentação
  const productsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);
  
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
    <div className="w-full flex flex-col gap-8">
      <CashFlowHeader register={activeCashRegister} finalBalance={metrics.finalBalance} />
      <CashFlowMetrics metrics={metrics} />
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end mb-4">
             <AddMovementDialog cashRegister={activeCashRegister} products={activeProducts} />
          </div>
          <RecentMovementsTable movements={movements || []} />
        </CardContent>
      </Card>
    </div>
  );
}
