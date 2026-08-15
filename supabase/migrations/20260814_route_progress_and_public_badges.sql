-- Progresso das Rotas por usuário e selos públicos dos perfis autorizados.
create table if not exists public.puxarota_route_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{"routes":{},"badges":[],"events":[]}'::jsonb,
  badges text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);

alter table public.puxarota_route_progress enable row level security;
drop policy if exists "owners manage route progress" on public.puxarota_route_progress;
create policy "owners manage route progress" on public.puxarota_route_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.list_public_puxarota_profiles()
returns table (
  id uuid, profile_type text, display_name text, region text, vehicle text,
  cargo_preference text, availability text, journey_badges text[]
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.profile_type, p.display_name, p.region, p.vehicle,
    p.cargo_preference, p.availability, coalesce(r.badges, '{}'::text[])
  from public.puxarota_profiles p
  left join public.puxarota_route_progress r on r.user_id = p.user_id
  where p.status = 'approved' and p.public_visible = true and p.consent_public = true
  order by p.approved_at desc nulls last;
$$;

grant execute on function public.list_public_puxarota_profiles() to anon, authenticated;
