-- Ledger mínimo de estoque (insumos). Mantém supplies.stock como saldo espelho.
-- Executar no projeto Supabase (SQL Editor).
--
-- Se der erro "is_tenant_member(uuid) does not exist", rode antes:
--   docs/supabase/migrations/20260509_is_tenant_member_prereq.sql

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  "tenantId" uuid not null references public.tenants(id) on delete cascade,
  item_type text not null default 'supply' check (item_type = 'supply'),
  "supplyId" uuid references public.supplies(id) on delete set null,
  "productId" uuid references public.products(id) on delete set null,
  movement_type text not null check (
    movement_type in (
      'PURCHASE',
      'ADJUSTMENT',
      'SALE_CONSUME',
      'PRODUCTION_CONSUME',
      'PRODUCTION_OUTPUT'
    )
  ),
  quantity_delta numeric(14, 4) not null,
  unit text not null,
  unit_cost numeric(14, 6),
  note text,
  "orderId" uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_movements_tenant_created
  on public.inventory_movements ("tenantId", created_at desc);

create index if not exists idx_inventory_movements_supply
  on public.inventory_movements ("tenantId", "supplyId", created_at desc);

comment on table public.inventory_movements is 'Histórico de movimentação de estoque (MVP: insumos). quantity_delta positivo = entrada na unidade informada.';

alter table public.inventory_movements enable row level security;

drop policy if exists "inventory_movements tenant access" on public.inventory_movements;
create policy "inventory_movements tenant access"
  on public.inventory_movements
  for all
  to authenticated
  using (public.is_tenant_member("tenantId"))
  with check (public.is_tenant_member("tenantId"));

-- Atualiza supplies.stock e insere linha no ledger de forma atômica.
create or replace function public.apply_supply_inventory_movement(
  p_tenant_id uuid,
  p_supply_id uuid,
  p_quantity_delta numeric,
  p_movement_type text,
  p_note text default null,
  p_unit_cost numeric default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock numeric;
  v_unit text;
  v_new numeric;
begin
  if not public.is_tenant_member(p_tenant_id) then
    raise exception 'not authorized';
  end if;

  select stock, unit into v_stock, v_unit
  from public.supplies
  where id = p_supply_id and "tenantId" = p_tenant_id
  for update;

  if not found then
    raise exception 'supply not found';
  end if;

  if p_quantity_delta = 0 then
    return json_build_object('stock', v_stock);
  end if;

  v_new := v_stock + p_quantity_delta;
  if v_new < 0 then
    raise exception 'stock would become negative';
  end if;

  update public.supplies
  set stock = v_new,
      "updatedAt" = now()
  where id = p_supply_id and "tenantId" = p_tenant_id;

  insert into public.inventory_movements (
    "tenantId",
    item_type,
    "supplyId",
    movement_type,
    quantity_delta,
    unit,
    unit_cost,
    note
  )
  values (
    p_tenant_id,
    'supply',
    p_supply_id,
    p_movement_type,
    p_quantity_delta,
    v_unit,
    p_unit_cost,
    p_note
  );

  return json_build_object('stock', v_new);
end;
$$;

revoke all on function public.apply_supply_inventory_movement(uuid, uuid, numeric, text, text, numeric) from public;
grant execute on function public.apply_supply_inventory_movement(uuid, uuid, numeric, text, text, numeric) to authenticated;
