-- Produtos: estoque sempre na menor unidade inteira (g, ml, un).
-- Compatível com linhas antigas: unit_type default 'un', display_unit opcional.

alter table public.products
  add column if not exists unit_type text not null default 'un';

alter table public.products
  add column if not exists display_unit text null;

alter table public.products
  drop constraint if exists products_unit_type_check;

alter table public.products
  add constraint products_unit_type_check
  check (unit_type in ('g', 'ml', 'un'));

comment on column public.products.stock_quantity is 'Quantidade em menor unidade inteira (sempre inteiro): gramas, mililitros ou unidades.';
comment on column public.products.unit_type is 'Tipo base do estoque: g (peso), ml (líquido), un (unitário).';
comment on column public.products.display_unit is 'Preferência de exibição opcional (ex.: kg, L, caixa). Conversão apenas na interface.';
