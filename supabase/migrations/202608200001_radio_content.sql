-- Radio PuxaRota: catalogo, favoritos, progresso e arquivos protegidos

create table if not exists public.puxarota_audio_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('daily','story','road_life')),
  title text not null check (char_length(title) between 3 and 90),
  teaser text not null check (char_length(teaser) between 10 and 240),
  synopsis text,
  category text,
  season_title text,
  season_number integer check (season_number is null or season_number > 0),
  episode_number integer check (episode_number is null or episode_number > 0),
  audio_path text,
  cover_path text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  access_level text not null default 'free' check (access_level in ('free','subscriber')),
  allow_download boolean not null default false,
  tags text[] not null default '{}',
  source_url text,
  verified_at date,
  featured_today boolean not null default false,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  scheduled_for timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_episode_fields check (
    kind <> 'story' or (season_title is not null and season_number is not null and episode_number is not null)
  )
);

create index if not exists puxarota_audio_items_public_idx
  on public.puxarota_audio_items (status, published_at desc);
create index if not exists puxarota_audio_items_story_idx
  on public.puxarota_audio_items (season_number, episode_number)
  where kind = 'story';

create table if not exists public.puxarota_audio_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_id uuid not null references public.puxarota_audio_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, audio_id)
);

create table if not exists public.puxarota_audio_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_id uuid not null references public.puxarota_audio_items(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed_at timestamptz,
  last_played_at timestamptz not null default now(),
  primary key (user_id, audio_id)
);

alter table public.puxarota_audio_items enable row level security;
alter table public.puxarota_audio_saves enable row level security;
alter table public.puxarota_audio_progress enable row level security;

drop policy if exists "published radio metadata is visible" on public.puxarota_audio_items;
create policy "published radio metadata is visible"
  on public.puxarota_audio_items for select
  to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

drop policy if exists "admins manage radio content" on public.puxarota_audio_items;
create policy "admins manage radio content"
  on public.puxarota_audio_items for all
  to authenticated
  using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

drop policy if exists "owners manage radio saves" on public.puxarota_audio_saves;
create policy "owners manage radio saves"
  on public.puxarota_audio_saves for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owners manage radio progress" on public.puxarota_audio_progress;
create policy "owners manage radio progress"
  on public.puxarota_audio_progress for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'puxarota-radio',
  'puxarota-radio',
  false,
  262144000,
  array['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/ogg','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins manage radio files" on storage.objects;
create policy "admins manage radio files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'puxarota-radio' and public.is_puxarota_admin(auth.uid()))
  with check (bucket_id = 'puxarota-radio' and public.is_puxarota_admin(auth.uid()));

drop policy if exists "published radio files are readable" on storage.objects;
create policy "published radio files are readable"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'puxarota-radio'
    and exists (
      select 1
      from public.puxarota_audio_items item
      where item.status = 'published'
        and item.published_at is not null
        and item.published_at <= now()
        and (
          item.cover_path = name
          or (
            item.audio_path = name
            and (
              item.access_level = 'free'
              or exists (
                select 1
                from public.puxarota_accounts account
                where account.user_id = auth.uid()
                  and account.license_status in ('trial','active')
              )
            )
          )
        )
    )
  );

create or replace function public.set_puxarota_audio_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists puxarota_audio_items_updated_at on public.puxarota_audio_items;
create trigger puxarota_audio_items_updated_at
before insert or update on public.puxarota_audio_items
for each row execute function public.set_puxarota_audio_updated_at();
