-- Avaliações da relação profissional-empresa, separadas do legado de reviews.
create table if not exists public.puxarota_engagement_reviews (
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
create index if not exists puxarota_engagement_reviews_reviewed_idx on public.puxarota_engagement_reviews(reviewed_user_id, created_at desc);
alter table public.puxarota_engagement_reviews enable row level security;
create policy "engagement review participants can read" on public.puxarota_engagement_reviews for select to authenticated
  using (auth.uid() in (reviewer_user_id, reviewed_user_id) or public.is_puxarota_admin(auth.uid()));
create policy "engagement participants can review" on public.puxarota_engagement_reviews for insert to authenticated
  with check (
    reviewer_user_id = auth.uid() and reviewer_user_id <> reviewed_user_id and
    exists (select 1 from public.puxarota_hires h where h.id = hire_id and h.status in ('hired','completed')
      and auth.uid() in (h.professional_user_id,h.company_user_id)
      and reviewed_user_id in (h.professional_user_id,h.company_user_id))
  );
create or replace function public.log_puxarota_engagement_review()
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
create trigger on_puxarota_engagement_review after insert on public.puxarota_engagement_reviews
  for each row execute procedure public.log_puxarota_engagement_review();
