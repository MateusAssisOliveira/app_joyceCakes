-- Backfill para usuários já existentes no Auth (quando profiles/tenants não foram criados pelo trigger)
-- Cole no Supabase SQL Editor e execute.
--
-- O app pode chamar esta função via RPC: supabase.rpc('ensure_profile_and_tenant')

create extension if not exists pgcrypto;

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
  -- Se já existe profile com tenant ativo, não faz nada.
  select p.active_tenant_id into existing_tenant
  from public.profiles p
  where p.user_id = auth.uid();

  if existing_tenant is not null then
    tenant_id := existing_tenant;
    return next;
    return;
  end if;

  -- cria tenant + profile para o usuário logado
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

  tenant_id := created_tenant;
  return next;
end;
$$;

