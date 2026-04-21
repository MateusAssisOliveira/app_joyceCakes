
'use client';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminInventoryPage() {
  return (
    <div className="w-full h-full flex flex-col gap-4 sm:gap-6">
      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Estoque (em migração)</CardTitle>
          <CardDescription>
            Esta tela ainda usa Firebase e está sendo migrada para Supabase. Para evitar erros, ela foi
            temporariamente desativada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/dashboard">Voltar ao Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">Abrir Produtos</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
