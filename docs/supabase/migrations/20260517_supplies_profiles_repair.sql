-- Reparo para producao: alinha o schema usado pelo app e recompoe permissoes
-- basicas do PostgREST para supplies/profiles.
--
-- Rode no Supabase SQL Editor. E idempotente e nao apaga dados.

alter table public.supplies
  add column if not exists brand text not null default '';

alter table public.supplies
  add column if not exists "tenantId" uuid,
  add column if not exists "costPerUnit" numeric not null default 0,
  add column if not exists "purchaseFormat" text not null default 'unidade',
  add column if not exists "packageCost" numeric,
  add column if not exists "packageQuantity" numeric,
  add column if not exists "lastPurchaseDate" timestamp with time zone,
  add column if not exists "expirationDate" timestamp with time zone,
  add column if not exists "minStock" numeric not null default 0,
  add column if not exists "isActive" boolean not null default true,
  add column if not exists "createdAt" timestamp with time zone not null default now(),
  add column if not exists "updatedAt" timestamp with time zone not null default now();

comment on column public.supplies.brand is
  'Marca comercial (ex.: Italac). Cadastro; nao confundir com fornecedor.';

update public.supplies
set
  "tenantId" = coalesce("tenantId", tenant_id),
  "costPerUnit" = coalesce("costPerUnit", cost_per_unit, 0),
  "purchaseFormat" = coalesce("purchaseFormat", purchase_format, 'unidade'),
  "packageCost" = coalesce("packageCost", package_cost),
  "packageQuantity" = coalesce("packageQuantity", package_quantity),
  "lastPurchaseDate" = coalesce("lastPurchaseDate", last_purchase_date),
  "expirationDate" = coalesce("expirationDate", expiration_date),
  "minStock" = coalesce("minStock", min_stock, 0),
  "isActive" = coalesce("isActive", is_active, true),
  "createdAt" = coalesce("createdAt", created_at, now()),
  "updatedAt" = coalesce("updatedAt", updated_at, now())
where true;

create or replace function public.sync_supplies_case_columns()
returns trigger
language plpgsql
as $$
begin
  new."tenantId" := coalesce(new."tenantId", new.tenant_id);
  new.tenant_id := coalesce(new.tenant_id, new."tenantId");

  new."costPerUnit" := coalesce(new."costPerUnit", new.cost_per_unit, 0);
  new.cost_per_unit := coalesce(new.cost_per_unit, new."costPerUnit", 0);

  new."purchaseFormat" := coalesce(new."purchaseFormat", new.purchase_format, 'unidade');
  new.purchase_format := coalesce(new.purchase_format, new."purchaseFormat", 'unidade');

  new."packageCost" := coalesce(new."packageCost", new.package_cost);
  new.package_cost := coalesce(new.package_cost, new."packageCost");

  new."packageQuantity" := coalesce(new."packageQuantity", new.package_quantity);
  new.package_quantity := coalesce(new.package_quantity, new."packageQuantity");

  new."lastPurchaseDate" := coalesce(new."lastPurchaseDate", new.last_purchase_date);
  new.last_purchase_date := coalesce(new.last_purchase_date, new."lastPurchaseDate");

  new."expirationDate" := coalesce(new."expirationDate", new.expiration_date);
  new.expiration_date := coalesce(new.expiration_date, new."expirationDate");

  new."minStock" := coalesce(new."minStock", new.min_stock, 0);
  new.min_stock := coalesce(new.min_stock, new."minStock", 0);

  new."isActive" := coalesce(new."isActive", new.is_active, true);
  new.is_active := coalesce(new.is_active, new."isActive", true);

  new."createdAt" := coalesce(new."createdAt", new.created_at, now());
  new.created_at := coalesce(new.created_at, new."createdAt", now());

  new."updatedAt" := coalesce(new."updatedAt", new.updated_at, now());
  new.updated_at := coalesce(new.updated_at, new."updatedAt", now());

  return new;
end;
$$;

drop trigger if exists trg_sync_supplies_case_columns on public.supplies;
create trigger trg_sync_supplies_case_columns
before insert or update on public.supplies
for each row execute function public.sync_supplies_case_columns();

alter table public.profiles
  add column if not exists active_cash_register_id uuid;

alter table public.profiles enable row level security;
alter table public.supplies enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.supplies to authenticated;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self write" on public.profiles
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.ensure_profile_and_tenant()
returns table (tenant_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_tenant uuid;
  created_tenant uuid;
  display_name text;
begin
  select p.active_tenant_id into existing_tenant
  from public.profiles p
  where p.user_id = auth.uid();

  if existing_tenant is not null then
    tenant_id := existing_tenant;
    return next;
    return;
  end if;

  select coalesce(nullif(auth.jwt() ->> 'email', ''), 'Minha Confeitaria') into display_name;
  display_name := split_part(display_name, '@', 1);

  insert into public.tenants (name, owner_user_id)
  values (display_name, auth.uid())
  returning id into created_tenant;

  insert into public.profiles (user_id, email, name, active_tenant_id)
  values (auth.uid(), auth.jwt() ->> 'email', display_name, created_tenant)
  on conflict (user_id) do update
  set active_tenant_id = excluded.active_tenant_id,
      updated_at = now();

  insert into public.tenant_members ("tenantId", "userId", role, status)
  values (created_tenant, auth.uid(), 'owner', 'active')
  on conflict ("tenantId", "userId") do update
  set role = excluded.role,
      status = excluded.status,
      "updatedAt" = now();

  tenant_id := created_tenant;
  return next;
end;
$$;

revoke all on function public.ensure_profile_and_tenant() from public;
grant execute on function public.ensure_profile_and_tenant() to authenticated;

notify pgrst, 'reload schema';
