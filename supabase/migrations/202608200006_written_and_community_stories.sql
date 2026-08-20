-- Contos oficiais para leitura e contos enviados pela comunidade

alter table public.puxarota_audio_items
  add column if not exists has_written_story boolean not null default false;

create table if not exists public.puxarota_written_stories (
  audio_id uuid primary key references public.puxarota_audio_items(id) on delete cascade,
  body text not null check (char_length(body) between 80 and 30000),
  updated_at timestamptz not null default now()
);

alter table public.puxarota_written_stories enable row level security;

drop policy if exists "admins manage official written stories" on public.puxarota_written_stories;
create policy "admins manage official written stories"
  on public.puxarota_written_stories for all
  to authenticated
  using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

create or replace function public.get_puxarota_written_story(p_audio_id uuid)
returns table (title text, body text)
language plpgsql
security definer
set search_path = public
as $$
declare
  requested public.puxarota_audio_items%rowtype;
  allowed boolean := false;
begin
  select * into requested
  from public.puxarota_audio_items
  where id = p_audio_id
    and status = 'published'
    and has_written_story = true
    and published_at is not null
    and published_at <= now();

  if not found then return; end if;
  allowed := requested.access_level = 'free';

  if auth.uid() is not null then
    allowed := allowed
      or public.is_puxarota_admin(auth.uid())
      or exists (
        select 1 from public.puxarota_accounts account
        where account.user_id = auth.uid()
          and (
            account.license_status in ('trial','active')
            or account.subscription_status = 'active'
          )
      );
  end if;

  if not allowed then return; end if;

  return query
  select requested.title, story.body
  from public.puxarota_written_stories story
  where story.audio_id = p_audio_id;
end;
$$;

revoke all on function public.get_puxarota_written_story(uuid) from public;
grant execute on function public.get_puxarota_written_story(uuid) to anon, authenticated;

create table if not exists public.puxarota_community_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  author_name text not null check (char_length(author_name) between 2 and 60),
  body text not null check (char_length(body) between 120 and 30000),
  consent_public boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  public_visible boolean not null default false,
  admin_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.puxarota_community_stories enable row level security;

drop policy if exists "members submit community stories" on public.puxarota_community_stories;
create policy "members submit community stories"
  on public.puxarota_community_stories for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and consent_public = true
    and status = 'pending'
    and public_visible = false
    and reviewed_at is null
    and reviewed_by is null
  );

drop policy if exists "owners read their community stories" on public.puxarota_community_stories;
create policy "owners read their community stories"
  on public.puxarota_community_stories for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "approved community stories are public" on public.puxarota_community_stories;
create policy "approved community stories are public"
  on public.puxarota_community_stories for select
  to anon, authenticated
  using (status = 'approved' and public_visible = true and consent_public = true);

drop policy if exists "admins manage community stories" on public.puxarota_community_stories;
create policy "admins manage community stories"
  on public.puxarota_community_stories for all
  to authenticated
  using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

create index if not exists puxarota_community_stories_public_idx
  on public.puxarota_community_stories (status, public_visible, reviewed_at desc);
create index if not exists puxarota_community_stories_owner_idx
  on public.puxarota_community_stories (user_id, created_at desc);

create table if not exists public.puxarota_story_reports (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.puxarota_community_stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  status text not null default 'new' check (status in ('new','reviewed','archived')),
  created_at timestamptz not null default now(),
  unique (story_id, user_id)
);

alter table public.puxarota_story_reports enable row level security;

drop policy if exists "members report public stories" on public.puxarota_story_reports;
create policy "members report public stories"
  on public.puxarota_story_reports for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'new'
    and exists (
      select 1 from public.puxarota_community_stories story
      where story.id = story_id
        and story.status = 'approved'
        and story.public_visible = true
    )
  );

drop policy if exists "admins manage story reports" on public.puxarota_story_reports;
create policy "admins manage story reports"
  on public.puxarota_story_reports for all
  to authenticated
  using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

create or replace function public.withdraw_community_story(p_story_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.puxarota_community_stories
  set status = 'archived', public_visible = false, updated_at = now()
  where id = p_story_id and user_id = auth.uid();
  return found;
end;
$$;

revoke all on function public.withdraw_community_story(uuid) from public;
grant execute on function public.withdraw_community_story(uuid) to authenticated;
