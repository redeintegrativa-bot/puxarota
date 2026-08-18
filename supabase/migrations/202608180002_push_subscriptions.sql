create table if not exists public.puxarota_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.puxarota_accounts(user_id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.puxarota_push_subscriptions enable row level security;

drop policy if exists "owner manages own push subscriptions" on public.puxarota_push_subscriptions;
create policy "owner manages own push subscriptions"
  on public.puxarota_push_subscriptions for all
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admins can read push subscriptions" on public.puxarota_push_subscriptions;
create policy "admins can read push subscriptions"
  on public.puxarota_push_subscriptions for select
  to authenticated using (public.is_puxarota_admin(auth.uid()));