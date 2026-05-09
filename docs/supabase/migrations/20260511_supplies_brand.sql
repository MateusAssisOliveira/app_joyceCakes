-- Marca do insumo (cadastro simples). Opcional no app; default vazio.
alter table public.supplies add column if not exists brand text not null default '';

comment on column public.supplies.brand is 'Marca comercial (ex.: Italac). Cadastro; não confundir com fornecedor.';
