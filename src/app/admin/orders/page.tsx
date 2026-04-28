'use client';

import { useEffect, useState } from 'react';
import { PointOfSaleClient } from './point-of-sale-client';
import { getProducts } from '@/services';
import type { Product } from '@/types';
import { Loader } from 'lucide-react';
import { useActiveTenant } from '@/hooks/use-active-tenant';

function ProductsDataLoader() {
  const { activeTenantId, isLoading: isTenantLoading } = useActiveTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!activeTenantId) {
      setProducts([]);
      setError(null);
      setIsLoading(isTenantLoading);
      return;
    }

    setIsLoading(true);
    setError(null);

    getProducts(null, activeTenantId)
      .then((items) => {
        if (!active) return;
        setProducts(items);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message ?? 'Falha ao carregar produtos.');
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTenantId, isTenantLoading]);

  if (isTenantLoading || isLoading) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-lg font-semibold">Carregando dados do PDV...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center gap-4 text-destructive">
        <p className="text-lg font-semibold">Erro ao carregar produtos</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return <PointOfSaleClient products={products} />;
}

export default function PointOfSalePage() {
  return (
    <div className="w-full h-full flex flex-col gap-4 sm:gap-6">
      <ProductsDataLoader />
    </div>
  );
}
