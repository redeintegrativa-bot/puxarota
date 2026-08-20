-- Uma unica regra de assinatura: license_status canonico e espelho legado sincronizado

alter table public.puxarota_accounts
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text default 'free',
  add column if not exists subscription_current_period_end timestamptz;

update public.puxarota_accounts
set license_status = case
  when subscription_status = 'active' then 'active'
  when subscription_status = 'trial' then 'trial'
  when subscription_status = 'past_due' then 'past_due'
  when subscription_status in ('cancelled','canceled') then 'cancelled'
  else license_status
end;

update public.puxarota_accounts
set subscription_status = license_status;

alter table public.puxarota_accounts
  drop constraint if exists puxarota_accounts_subscription_status_check;
alter table public.puxarota_accounts
  add constraint puxarota_accounts_subscription_status_check
  check (subscription_status in ('free','trial','active','past_due','cancelled'));

create unique index if not exists puxarota_accounts_stripe_customer_idx
  on public.puxarota_accounts (stripe_customer_id)
  where stripe_customer_id is not null;

create or replace function public.sync_puxarota_subscription_status()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  canonical text;
begin
  if tg_op = 'UPDATE' and new.license_status is distinct from old.license_status then
    canonical := new.license_status;
  elsif tg_op = 'UPDATE' and new.subscription_status is distinct from old.subscription_status then
    canonical := case when new.subscription_status = 'canceled' then 'cancelled' else new.subscription_status end;
  else
    canonical := coalesce(new.license_status, new.subscription_status, 'free');
  end if;

  if canonical not in ('free','trial','active','past_due','cancelled') then canonical := 'free'; end if;
  new.license_status := canonical;
  new.subscription_status := canonical;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists puxarota_accounts_sync_subscription on public.puxarota_accounts;
create trigger puxarota_accounts_sync_subscription
before insert or update of license_status, subscription_status on public.puxarota_accounts
for each row execute function public.sync_puxarota_subscription_status();
