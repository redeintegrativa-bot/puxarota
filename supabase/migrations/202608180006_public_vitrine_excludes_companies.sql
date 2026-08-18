-- Vitrine pública de profissionais: empresas (transportadoras) nunca aparecem
-- na vitrine. Elas são aprovadas para gestão própria, não para publicação.
drop function if exists public.list_public_puxarota_profiles();
create or replace function public.list_public_puxarota_profiles()
returns table (
  id uuid, profile_type text, display_name text, region text, vehicle text,
  license_category text, cargo_preference text, availability text, journey_badges text[]
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.profile_type,
    trim(split_part(coalesce(p.display_name, ''), ' ', 1)) as display_name,
    p.region, p.vehicle, p.license_category, p.cargo_preference, p.availability,
    coalesce(r.badges, '{}'::text[])
  from public.puxarota_profiles p
  left join public.puxarota_route_progress r on r.user_id = p.user_id
  where p.status = 'approved' and p.public_visible = true and p.consent_public = true
    and p.profile_type <> 'company'
  order by p.approved_at desc nulls last;
$$;

grant execute on function public.list_public_puxarota_profiles() to anon, authenticated;