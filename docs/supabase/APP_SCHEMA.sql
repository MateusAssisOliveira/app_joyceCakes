create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  active_tenant_id uuid references public.tenants(id) on delete set null,
  active_cash_register_id uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',
  status text not null default 'active',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  primary key ("tenantId", "userId")
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(12,2) not null default 0,
  "costPrice" numeric(12,2) not null default 0,
  category text not null default '',
  "imageUrlId" text not null default '',
  stock_quantity integer not null default 0,
  "isActive" boolean not null default true,
  components jsonb,
  "preparationTime" integer,
  "laborCost" numeric(12,2) not null default 0,
  "fixedCost" numeric(12,2) not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sku text not null default '',
  category text not null default 'Geral',
  type text not null default 'ingredient',
  stock numeric(12,3) not null default 0,
  unit text not null,
  "costPerUnit" numeric(12,4) not null default 0,
  "purchaseFormat" text,
  "packageCost" numeric(12,2),
  "packageQuantity" numeric(12,3),
  supplier text,
  "lastPurchaseDate" timestamptz,
  "expirationDate" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "minStock" numeric(12,3) not null default 0,
  "isActive" boolean not null default true
);

create table if not exists public.supply_price_history (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  "supplyId" uuid not null references public.supplies(id) on delete cascade,
  date timestamptz not null default now(),
  "costPerUnit" numeric(12,4) not null default 0,
  supplier text
);

create table if not exists public.technical_sheets (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text not null default '',
  type text not null default 'base',
  components jsonb not null default '[]'::jsonb,
  steps text not null default '',
  yield text not null default '',
  "totalCost" numeric(12,2) not null default 0,
  "suggestedPrice" numeric(12,2) not null default 0,
  "lossFactor" numeric(12,3),
  "preparationTime" integer,
  "laborCost" numeric(12,2) not null default 0,
  "fixedCost" numeric(12,2) not null default 0,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "openingDate" timestamptz not null default now(),
  "closingDate" timestamptz,
  "initialBalance" numeric(12,2) not null default 0,
  "finalBalance" numeric(12,2),
  "totalSales" numeric(12,2) not null default 0,
  "totalExpenses" numeric(12,2) not null default 0,
  status text not null default 'open',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  "orderNumber" text not null,
  "createdAt" timestamptz not null default now(),
  date timestamptz,
  "customerName" text not null default '',
  "userId" uuid references auth.users(id) on delete set null,
  "cashRegisterId" uuid references public.cash_registers(id) on delete set null,
  "paymentMethod" text,
  total numeric(12,2) not null default 0,
  "totalCost" numeric(12,2) not null default 0,
  status text not null default 'Pendente',
  items jsonb not null default '[]'::jsonb,
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.financial_movements (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  "cashRegisterId" uuid not null references public.cash_registers(id) on delete cascade,
  type text not null,
  category text not null default '',
  description text not null default '',
  amount numeric(12,2) not null default 0,
  "paymentMethod" text,
  "movementDate" timestamptz not null default now(),
  "orderId" uuid references public.orders(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_products_tenant on public.products ("tenantId", "updatedAt" desc);
create index if not exists idx_supplies_tenant on public.supplies ("tenantId", "updatedAt" desc);
create index if not exists idx_orders_tenant on public.orders ("tenantId", "createdAt" desc);
create index if not exists idx_sheets_tenant on public.technical_sheets ("tenantId", "updatedAt" desc);
create index if not exists idx_cash_registers_tenant on public.cash_registers ("tenantId", "openingDate" desc);
create index if not exists idx_movements_register on public.financial_movements ("cashRegisterId", "movementDate" desc);
create index if not exists idx_supply_history_supply on public.supply_price_history ("supplyId", date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_supplies_updated_at on public.supplies;
create trigger trg_supplies_updated_at before update on public.supplies
for each row execute function public.set_updated_at();

drop trigger if exists trg_sheets_updated_at on public.technical_sheets;
create trigger trg_sheets_updated_at before update on public.technical_sheets
for each row execute function public.set_updated_at();

drop trigger if exists trg_cash_registers_updated_at on public.cash_registers;
create trigger trg_cash_registers_updated_at before update on public.cash_registers
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_financial_movements_updated_at on public.financial_movements;
create trigger trg_financial_movements_updated_at before update on public.financial_movements
for each row execute function public.set_updated_at();

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

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_members enable row level security;
alter table public.products enable row level security;
alter table public.supplies enable row level security;
alter table public.supply_price_history enable row level security;
alter table public.technical_sheets enable row level security;
alter table public.cash_registers enable row level security;
alter table public.orders enable row level security;
alter table public.financial_movements enable row level security;

create or replace function public.is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm."tenantId" = target_tenant
      and tm."userId" = auth.uid()
      and tm.status = 'active'
  );
$$;

create or replace function public.is_tenant_admin(target_tenant uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm."tenantId" = target_tenant
      and tm."userId" = auth.uid()
      and tm.status = 'active'
      and tm.role in ('owner', 'admin')
  );
$$;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self write" on public.profiles
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "tenants member read" on public.tenants;
create policy "tenants member read" on public.tenants
for select to authenticated
using (public.is_tenant_member(id));

drop policy if exists "tenants owner insert" on public.tenants;
create policy "tenants owner insert" on public.tenants
for insert to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "tenants owner update" on public.tenants;
create policy "tenants owner update" on public.tenants
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "tenant members read" on public.tenant_members;
create policy "tenant members read" on public.tenant_members
for select to authenticated
using (public.is_tenant_member("tenantId"));

drop policy if exists "tenant members admin write" on public.tenant_members;
create policy "tenant members admin write" on public.tenant_members
for all to authenticated
using (public.is_tenant_admin("tenantId"))
with check (public.is_tenant_admin("tenantId"));

drop policy if exists "products tenant access" on public.products;
create policy "products tenant access" on public.products
for all to authenticated
using (public.is_tenant_member("tenantId"))
with check (public.is_tenant_member("tenantId"));

drop policy if exists "supplies tenant access" on public.supplies;
create policy "supplies tenant access" on public.supplies
for all to authenticated
using (public.is_tenant_member("tenantId"))
with check (public.is_tenant_member("tenantId"));

drop policy if exists "supply history tenant access" on public.supply_price_history;
create policy "supply history tenant access" on public.supply_price_history
for all to authenticated
using (public.is_tenant_member("tenantId"))
with check (public.is_tenant_member("tenantId"));

drop policy if exists "technical sheets tenant access" on public.technical_sheets;
create policy "technical sheets tenant access" on public.technical_sheets
for all to authenticated
using (public.is_tenant_member("tenantId"))
with check (public.is_tenant_member("tenantId"));

drop policy if exists "cash registers tenant access" on public.cash_registers;
create policy "cash registers tenant access" on public.cash_registers
for all to authenticated
using (public.is_tenant_member("tenantId"))
with check (public.is_tenant_member("tenantId"));

drop policy if exists "orders tenant access" on public.orders;
create policy "orders tenant access" on public.orders
for all to authenticated
using (public.is_tenant_member("tenantId"))
with check (public.is_tenant_member("tenantId"));

drop policy if exists "financial movements tenant access" on public.financial_movements;
create policy "financial movements tenant access" on public.financial_movements
for all to authenticated
using (public.is_tenant_member("tenantId"))
with check (public.is_tenant_member("tenantId"));
