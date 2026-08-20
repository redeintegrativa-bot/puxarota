-- Confirma a conta principal informada pelo responsavel do PuxaRota.
do $$
declare
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where lower(email) = 'redeintegrativa@gmail.com'
  limit 1;

  if admin_user_id is null then
    raise exception 'A conta redeintegrativa@gmail.com ainda nao existe no Supabase Auth';
  end if;

  insert into public.puxarota_accounts (
    user_id,
    account_type,
    display_name,
    is_approved,
    license_status,
    updated_at
  ) values (
    admin_user_id,
    'admin',
    'Rede Integrativa',
    true,
    'active',
    now()
  )
  on conflict (user_id) do update set
    account_type = 'admin',
    display_name = coalesce(public.puxarota_accounts.display_name, excluded.display_name),
    is_approved = true,
    license_status = 'active',
    updated_at = now();
end;
$$;
