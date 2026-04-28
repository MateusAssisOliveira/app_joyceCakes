
'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { EditOrderClient } from "./edit-order-client";
import { getProducts, getOrderById } from '@/services';
import type { Order, Product } from "@/types";
import { Loader } from "lucide-react";
import { useActiveTenant } from "@/hooks/use-active-tenant";

// Este componente agora busca os dados no cliente
function OrderDataLoader() {
  const { activeTenantId } = useActiveTenant();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!activeTenantId || !orderId) {
        setProducts([]);
        setOrder(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [productsResult, orderResult] = await Promise.all([
          getProducts(null, activeTenantId),
          getOrderById(orderId, activeTenantId),
        ]);

        if (!active) return;

        setProducts(productsResult);
        setOrder(orderResult);
      } catch (error) {
        console.error("Falha ao carregar pedido ou produtos:", error);
        if (!active) return;
        setProducts([]);
        setOrder(null);
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [activeTenantId, orderId]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando editor de pedido...</p>
      </div>
    );
  }

  return <EditOrderClient order={order} products={products} tenantId={activeTenantId || undefined} />;
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
