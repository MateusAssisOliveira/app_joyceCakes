
'use client';

import { Suspense } from 'react';
import { ProductsClient } from "./products-client";
import { Loader } from 'lucide-react';

export default function AdminProductsPage() {
  
  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="glass-panel p-5 md:p-6">
        <h2 className="font-headline text-2xl font-bold tracking-tight">Catalogo de Produtos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize seu mix com foco em margem, padrao visual e disponibilidade.
        </p>
      </div>
       <Suspense fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <ProductsClient />
      </Suspense>
    </div>
  );
}
