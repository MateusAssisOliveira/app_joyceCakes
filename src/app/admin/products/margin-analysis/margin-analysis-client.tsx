"use client";

import { useMemo } from "react";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { Product } from "@/types";
import { Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarginAnalysis } from "@/components/admin/products/margin-analysis";
import { getTenantCollectionPath } from "@/lib/tenant";
import { useActiveTenant } from "@/hooks/use-active-tenant";

export function MarginAnalysisClient() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { activeTenantId } = useActiveTenant();

  const productsQuery = useMemo(() => {
    if (!firestore || !activeTenantId) return null;
    return query(collection(firestore, getTenantCollectionPath(activeTenantId, "products")));
  }, [firestore, activeTenantId]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Nenhum produto encontrado</p>
          <p className="text-sm">Cadastre produtos para ver a análise de margem</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Análise de Margem de Lucro</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e otimize a rentabilidade dos seus produtos
        </p>
      </div>
      <MarginAnalysis products={products} />
    </div>
  );
}
