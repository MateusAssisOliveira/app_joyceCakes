
'use client';

import { Suspense } from 'react';
import { ProductsClient } from "./products-client";
import { Loader } from 'lucide-react';

export default function AdminProductsPage() {
  
  return (
    <div className="w-full h-full flex flex-col">
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
