-- Histórico auditável, contratações e avaliações vinculadas ao user_id.
create table if not exists public.puxarota_activity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  company_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists puxarota_activity_user_date_idx on public.puxarota_activity_history(user_id, created_at desc);
create index if not exists puxarota_activity_company_date_idx on public.puxarota_activity_history(company_user_id, created_at desc);
alter table public.puxarota_activity_history enable row level security;
drop policy if exists "participants read activity history" on public.puxarota_activity_history;
create policy "participants read activity history" on public.puxarota_activity_history for select to authenticated
  using (auth.uid() in (user_id, actor_user_id, company_user_id) or public.is_puxarota_admin(auth.uid()));

create table if not exists public.puxarota_hires (
  id uuid primary key default gen_random_uuid(),
  professional_user_id uuid not null references auth.users(id) on delete restrict,
  company_user_id uuid not null references auth.users(id) on delete restrict,
  opportunity_id text references public.puxarota_opportunities(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','authorized','interview','hired','completed','cancelled')),
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists puxarota_hires_professional_idx on public.puxarota_hires(professional_user_id, created_at desc);
create index if not exists puxarota_hires_company_idx on public.puxarota_hires(company_user_id, created_at desc);
alter table public.puxarota_hires enable row level security;
drop policy if exists "hire participants can read" on public.puxarota_hires;
create policy "hire participants can read" on public.puxarota_hires for select to authenticated
  using (auth.uid() in (professional_user_id, company_user_id) or public.is_puxarota_admin(auth.uid()));
drop policy if exists "companies can request hires" on public.puxarota_hires;
create policy "companies can request hires" on public.puxarota_hires for insert to authenticated
  with check (company_user_id = auth.uid() and exists (
    select 1 from public.puxarota_accounts a where a.user_id = auth.uid() and a.account_type = 'company'
  ));
drop policy if exists "hire participants can update" on public.puxarota_hires;
create policy "hire participants can update" on public.puxarota_hires for update to authenticated
  using (auth.uid() in (professional_user_id, company_user_id) or public.is_puxarota_admin(auth.uid()))
  with check (auth.uid() in (professional_user_id, company_user_id) or public.is_puxarota_admin(auth.uid()));

create table if not exists public.puxarota_reviews (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.puxarota_hires(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  reviewed_user_id uuid not null references auth.users(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  public_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(hire_id, reviewer_user_id)
);
create index if not exists puxarota_reviews_reviewed_idx on public.puxarota_reviews(reviewed_user_id, created_at desc);
alter table public.puxarota_reviews enable row level security;
drop policy if exists "review participants can read" on public.puxarota_reviews;
create policy "review participants can read" on public.puxarota_reviews for select to authenticated
  using (auth.uid() in (reviewer_user_id, reviewed_user_id) or public.is_puxarota_admin(auth.uid()));
drop policy if exists "hire participants can review" on public.puxarota_reviews;
create policy "hire participants can review" on public.puxarota_reviews for insert to authenticated
  with check (
    reviewer_user_id = auth.uid() and reviewer_user_id <> reviewed_user_id and
    exists (select 1 from public.puxarota_hires h where h.id = hire_id and h.status in ('hired','completed')
      and auth.uid() in (h.professional_user_id,h.company_user_id)
      and reviewed_user_id in (h.professional_user_id,h.company_user_id))
  );

create or replace function public.record_puxarota_activity(
  p_event_type text, p_entity_type text default null, p_entity_id text default null, p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.puxarota_activity_history(user_id,actor_user_id,event_type,entity_type,entity_id,metadata)
  values(auth.uid(),auth.uid(),left(p_event_type,80),left(p_entity_type,40),left(p_entity_id,160),coalesce(p_metadata,'{}'::jsonb))
  returning id into new_id;
  return new_id;
end; $$;
grant execute on function public.record_puxarota_activity(text,text,text,jsonb) to authenticated;

create or replace function public.log_puxarota_hire_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare activity_type text;
begin
  activity_type := case when tg_op = 'INSERT' then 'hire_requested' else 'hire_' || new.status end;
  insert into public.puxarota_activity_history(user_id,actor_user_id,company_user_id,event_type,entity_type,entity_id,metadata)
  values
    (new.professional_user_id,coalesce(auth.uid(),new.company_user_id),new.company_user_id,activity_type,'hire',new.id::text,jsonb_build_object('status',new.status,'opportunity_id',new.opportunity_id)),
    (new.company_user_id,coalesce(auth.uid(),new.company_user_id),new.company_user_id,activity_type,'hire',new.id::text,jsonb_build_object('status',new.status,'opportunity_id',new.opportunity_id));
  return new;
end; $$;
drop trigger if exists on_puxarota_hire_activity on public.puxarota_hires;
create trigger on_puxarota_hire_activity after insert or update of status on public.puxarota_hires
  for each row execute procedure public.log_puxarota_hire_activity();

create or replace function public.log_puxarota_review_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare company_id uuid;
begin
  select h.company_user_id into company_id from public.puxarota_hires h where h.id = new.hire_id;
  insert into public.puxarota_activity_history(user_id,actor_user_id,company_user_id,event_type,entity_type,entity_id,metadata)
  values
    (new.reviewer_user_id,new.reviewer_user_id,company_id,'review_created','review',new.id::text,jsonb_build_object('rating',new.rating)),
    (new.reviewed_user_id,new.reviewer_user_id,company_id,'review_received','review',new.id::text,jsonb_build_object('rating',new.rating));
  return new;
end; $$;
drop trigger if exists on_puxarota_review_activity on public.puxarota_reviews;
create trigger on_puxarota_review_activity after insert on public.puxarota_reviews
  for each row execute procedure public.log_puxarota_review_activity();
