-- Pré-requisito para RLS e RPCs multi-tenant.
-- Rode ESTE arquivo no SQL Editor ANTES de 20260510_inventory_movements.sql
-- se aparecer: function public.is_tenant_member(uuid) does not exist.
--
-- Exige que public.tenants já exista (como no restante do app).

create table if not exists public.tenant_members (
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',
  status text not null default 'active',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  primary key ("tenantId", "userId")
);

create or replace function public.is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm."tenantId" = target_tenant
      and tm."userId" = auth.uid()
      and tm.status = 'active'
  );
$$;

comment on function public.is_tenant_member(uuid) is 'True se auth.uid() for membro ativo do tenant.';

-- Opcional: se tenant_members estiver vazia mas profiles já tiver active_tenant_id,
-- descomente e rode uma vez para não ficar sem acesso ao RPC:
--
-- insert into public.tenant_members ("tenantId", "userId", role, status)
-- select p.active_tenant_id, p.user_id, 'owner', 'active'
-- from public.profiles p
-- where p.active_tenant_id is not null
-- on conflict ("tenantId", "userId") do nothing;
