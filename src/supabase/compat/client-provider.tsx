'use client';

import type { ReactNode } from 'react';

interface SupabaseClientProviderProps {
  children: ReactNode;
}

export function SupabaseClientProvider({ children }: SupabaseClientProviderProps) {
  return <>{children}</>;
}
