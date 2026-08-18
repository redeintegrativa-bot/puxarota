alter table if exists public.puxarota_accounts add column if not exists last_login_at timestamptz;
alter table if exists public.puxarota_accounts add column if not exists last_seen_at timestamptz;

drop policy if exists "account owner can update own presence" on public.puxarota_accounts;
create policy "account owner can update own presence"
  on public.puxarota_accounts for update
  to authenticated using (user_id = auth.uid());