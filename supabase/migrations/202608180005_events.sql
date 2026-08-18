create table if not exists public.puxarota_events (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  description text not null default '',
  date timestamptz,
  minutes integer not null default 90 check (minutes between 15 and 300),
  link text,
  facebook text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.puxarota_events enable row level security;

drop policy if exists "events are public" on public.puxarota_events;
create policy "events are public"
  on public.puxarota_events for select
  to anon, authenticated using (active = true);

drop policy if exists "admins can manage events" on public.puxarota_events;
create policy "admins can manage events"
  on public.puxarota_events for all
  to authenticated using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));
