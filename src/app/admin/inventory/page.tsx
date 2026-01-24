
'use client';

import { Suspense } from 'react';
import { InventoryClient } from "./inventory-client";
import { Loader } from 'lucide-react';


export default function AdminInventoryPage() {

  return (
    <div className="w-full h-full flex flex-col">
       <Suspense fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <InventoryClient />
      </Suspense>
    </div>
  );
}

