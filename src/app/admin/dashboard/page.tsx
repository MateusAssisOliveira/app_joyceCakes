"use client";

import Link from "next/link";
import { DollarSign, Loader, PackageSearch, ShoppingBag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { useSupabase } from "@/supabase";

function MetricPill({
  title,
  value,
  description,
  Icon,
}: {
  title: string;
  value: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: isUserLoading } = useSupabase();
  const { activeTenantId } = useActiveTenant();

  if (isUserLoading) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-lg font-semibold">Carregando seu painel...</p>
          <p className="text-sm text-muted-foreground">Verificando sua sessão.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Card className="glass-panel overflow-hidden border-primary/20">
        <CardHeader className="relative">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
          <CardTitle className="font-headline text-3xl tracking-tight">Resumo do Dia</CardTitle>
          <CardDescription className="max-w-2xl text-sm md:text-base">
            Conectado com Supabase. Agora vamos migrar os módulos do Firebase para o banco SQL aos poucos (começando por Produtos).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/orders">Ir para Vendas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/inventory">Ver Estoque</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          title="Sessão"
          value={user ? "Ativa" : "Sem login"}
          description={user?.email ? `Usuário: ${user.email}` : "Faça login na página inicial."}
          Icon={TrendingUp}
        />
        <MetricPill
          title="Tenant"
          value={activeTenantId ? "OK" : "—"}
          description={activeTenantId ? `tenant_id: ${activeTenantId}` : "Aguardando profile/tenant."}
          Icon={PackageSearch}
        />
        <MetricPill
          title="Vendas hoje"
          value="—"
          description="Vai aparecer quando migrarmos Orders para Supabase."
          Icon={DollarSign}
        />
        <MetricPill
          title="Estoque baixo"
          value="—"
          description="Vai aparecer quando migrarmos Supplies para Supabase."
          Icon={ShoppingBag}
        />
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Próximo passo</CardTitle>
          <CardDescription>
            Migrar o primeiro CRUD (Produtos) para Supabase para validar escrita/leitura com RLS.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/products">Abrir Produtos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/inventory">Abrir Estoque</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
