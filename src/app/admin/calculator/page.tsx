
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
    <div className="w-full flex flex-col gap-8">
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
