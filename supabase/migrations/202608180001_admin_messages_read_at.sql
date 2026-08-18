alter table if exists public.puxarota_notifications add column if not exists read_at timestamptz;
alter table if exists public.puxarota_notifications add column if not exists button_label text;
alter table if exists public.puxarota_notifications add column if not exists button_url text;

drop policy if exists "account owner can update own notifications" on public.puxarota_notifications;
create policy "account owner can update own notifications"
  on public.puxarota_notifications for update
  to authenticated using (account_id = auth.uid());