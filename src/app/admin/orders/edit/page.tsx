
'use client';

import { useMemo, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { EditOrderClient } from "./edit-order-client";
import { useUser, useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import type { Order, Product } from "@/types";
import { Loader } from "lucide-react";

// Este componente agora busca os dados no cliente
function OrderDataLoader() {
  const firestore = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  // Busca os produtos
  const productsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "products"));
  }, [firestore, user]);
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  // Busca o pedido específico
  const orderRef = useMemo(() => {
    if (!firestore || !orderId) return null;
    return doc(firestore, 'orders', orderId);
  }, [firestore, orderId]);
  const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderRef);

  const isLoading = areProductsLoading || isOrderLoading;
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando editor de pedido...</p>
      </div>
    );
  }

  return <EditOrderClient order={order} products={products || []} />;
}

export default function EditOrderPage() {
  return (
    // Suspense é uma boa prática ao usar useSearchParams em um componente cliente
    <Suspense fallback={
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
        </div>
    }>
      <OrderDataLoader />
    </Suspense>
  );
}
