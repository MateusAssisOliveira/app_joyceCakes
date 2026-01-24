
'use client';

import { PointOfSaleClient } from "./point-of-sale-client";
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/types';
import { Loader } from "lucide-react";
import { useMemo } from 'react';

// Este componente agora busca os produtos no cliente
function ProductsDataLoader() {
  const firestore = useFirestore();
  const { user } = useUser();

  const productsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "products"));
  }, [firestore, user]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  if (isLoading) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
            <p className="text-lg font-semibold">Carregando dados do PDV...</p>
        </div>
      </div>
    );
  }
  
  // O PointOfSaleClient agora recebe os produtos como prop
  // e cuidará do carregamento dos pedidos em tempo real.
  return <PointOfSaleClient products={products || []} />;
}

export default function PointOfSalePage() {
  return (
    <div className="w-full h-full flex flex-col gap-8">
        <ProductsDataLoader />
    </div>
  );
}
