-- Empresas aprovadas podem submeter oportunidades que entram sob moderação
-- (status 'pending'). A aprovação acontece na gestão e publica na aba Cargas.
create or replace function public.create_puxarota_opportunity(
  p_company text, p_title text, p_detail text default null,
  p_origin text default null, p_area text default null,
  p_vehicles jsonb default '[]'::jsonb, p_model text default null,
  p_routine text default null, p_payment text default null
)
returns public.puxarota_opportunities
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_opportunity public.puxarota_opportunities;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.puxarota_profiles p
    where p.user_id = v_user and p.profile_type = 'company' and p.status = 'approved'
  ) then
    raise exception 'empresa aprovada requerida';
  end if;
  insert into public.puxarota_opportunities
    (id, company, title, source, source_url, origin, area, vehicles, model, routine, payment, detail, status)
  values
    (gen_random_uuid()::text, p_company, p_title, 'company', '', p_origin, p_area,
     coalesce(p_vehicles, '[]'::jsonb), p_model, p_routine, p_payment, p_detail, 'pending')
  returning * into v_opportunity;
  return v_opportunity;
end;
$$;

grant execute on function public.create_puxarota_opportunity(text, text, text, text, text, jsonb, text, text, text) to authenticated;

-- Notifica o Genésio (canal telegram_admin) quando uma empresa submete
-- oportunidade, no mesmo padrão do cadastro de usuário.
create or replace function public.queue_puxarota_opportunity_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.puxarota_notifications (channel, status, message)
  values ('telegram_admin', 'pending',
    'Nova oportunidade de empresa para aprovação: ' || coalesce(new.company, '') ||
    ' | vaga: ' || coalesce(new.title, '') ||
    ' | região: ' || coalesce(new.origin, 'não informada'));
  return new;
end;
$$;

drop trigger if exists on_puxarota_opportunity_created on public.puxarota_opportunities;
create trigger on_puxarota_opportunity_created
  after insert on public.puxarota_opportunities
  for each row when (new.source = 'company')
  execute procedure public.queue_puxarota_opportunity_notification();