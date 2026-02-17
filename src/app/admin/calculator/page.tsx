
'use client';

import { Suspense } from 'react';
import { CalculatorClient } from "./calculator-client";
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Supply } from '@/types';
import { Loader } from 'lucide-react';
import { useMemo } from 'react';

// Este componente agora busca os dados no cliente
function SuppliesDataLoader() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const suppliesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'supplies'));
  }, [firestore, user]);

  const { data: supplies, isLoading, error } = useCollection<Supply>(suppliesQuery);

  if (isLoading) {
    return (
       <div className="flex flex-1 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-destructive">
        <p>Erro ao carregar insumos: {error.message}</p>
      </div>
    )
  }

  return <CalculatorClient supplies={supplies || []} />;
}

export default function AdminCalculatorPage() {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="glass-panel p-5 md:p-6">
        <h2 className="font-headline text-2xl font-bold tracking-tight">Calculadora de Custos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Simule preco, margem e custos antes de ajustar o catalogo.
        </p>
      </div>
       <Suspense fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SuppliesDataLoader />
      </Suspense>
    </div>
  );
}
