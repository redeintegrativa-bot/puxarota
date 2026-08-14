-- Execute uma vez no SQL Editor do Supabase antes de usar a sincronização de e-mails.
alter table public.puxarota_accounts add column if not exists email_snapshot text;

create or replace function public.handle_new_puxarota_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.puxarota_accounts (user_id, account_type, display_name, email_snapshot)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'account_type', 'driver'),
    nullif(new.raw_user_meta_data->>'display_name', ''),
    new.email
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
