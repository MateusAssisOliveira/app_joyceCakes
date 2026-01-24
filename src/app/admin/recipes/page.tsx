
'use client';

import { Suspense } from 'react';
import { RecipesClient } from "./recipes-client";
import { Loader } from 'lucide-react';


export default function AdminRecipesPage() {
  
  return (
    <div className="w-full flex flex-col h-full">
      <Suspense fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <RecipesClient />
      </Suspense>
    </div>
  );
}
