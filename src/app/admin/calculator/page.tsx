
'use client';

import { Suspense } from 'react';
import { CalculatorClient } from "./calculator-client";
import { useCollection, useSupabaseStore } from '@/supabase/compat';
import { collection, query } from '@/supabase/compat/SupabaseStore';
import type { Supply } from '@/types';
import { Loader } from 'lucide-react';
import { useMemo } from 'react';
import { getTenantCollectionPath } from '@/lib/tenant';
import { useActiveTenant } from '@/hooks/use-active-tenant';

// Este componente agora busca os dados no cliente
function SuppliesDataLoader() {
  const SupabaseStore = useSupabaseStore();
  const { activeTenantId } = useActiveTenant();
  
  const suppliesQuery = useMemo(() => {
    if (!SupabaseStore || !activeTenantId) return null;
    return query(collection(SupabaseStore, getTenantCollectionPath(activeTenantId, "supplies")));
  }, [SupabaseStore, activeTenantId]);

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
