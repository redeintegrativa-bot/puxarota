-- Fila de oportunidades e interesses: tudo entra sob moderação administrativa.
create table if not exists public.puxarota_opportunities (
  id text primary key, company text not null, title text not null, source text not null,
  source_url text not null, origin text, area text, vehicles jsonb not null default '[]'::jsonb,
  model text, routine text, payment text, detail text, confidence integer,
  discovered_at timestamptz not null default now(), last_checked_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  reviewed_at timestamptz, reviewed_by uuid references auth.users(id) on delete set null
);
alter table public.puxarota_opportunities enable row level security;
create index if not exists puxarota_opportunities_status_idx on public.puxarota_opportunities (status, discovered_at desc);
drop policy if exists "admins can manage opportunities" on public.puxarota_opportunities;
create policy "admins can manage opportunities" on public.puxarota_opportunities for all to authenticated using (public.is_puxarota_admin(auth.uid())) with check (public.is_puxarota_admin(auth.uid()));
drop policy if exists "approved opportunities are public" on public.puxarota_opportunities;
create policy "approved opportunities are public" on public.puxarota_opportunities for select to anon, authenticated using (status = 'approved');

drop policy if exists "profile owner can create own interests" on public.puxarota_interests;
create policy "profile owner can create own interests" on public.puxarota_interests for insert to authenticated with check (
  exists (select 1 from public.puxarota_profiles where id = profile_id and user_id = auth.uid())
);

create or replace function public.queue_puxarota_interest_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.puxarota_notifications (account_id, interest_id, channel, status, message)
  select p.user_id, new.id, 'telegram_admin', 'pending',
    'Novo interesse no PuxaRota: ' || coalesce(new.requester_name, 'sem nome') ||
    ' | oportunidade: ' || coalesce(o.company, new.opportunity_id, 'não informada') ||
    ' | região: ' || coalesce(new.region, 'não informada')
  from public.puxarota_profiles p left join public.puxarota_opportunities o on o.id = new.opportunity_id
  where p.id = new.profile_id;
  return new;
end;
$$;
drop trigger if exists on_puxarota_interest_created on public.puxarota_interests;
create trigger on_puxarota_interest_created after insert on public.puxarota_interests for each row execute procedure public.queue_puxarota_interest_notification();
