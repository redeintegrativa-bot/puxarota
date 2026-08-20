-- Fontes de reproducao ficam separadas do catalogo publico.
-- Isso permite usar Google Drive sem expor o link na listagem de conteudos.

create table if not exists public.puxarota_audio_sources (
  audio_id uuid primary key references public.puxarota_audio_items(id) on delete cascade,
  source_type text not null check (source_type in ('google_drive','storage')),
  source_value text not null,
  updated_at timestamptz not null default now()
);

alter table public.puxarota_audio_sources enable row level security;

drop policy if exists "admins manage radio sources" on public.puxarota_audio_sources;
create policy "admins manage radio sources"
  on public.puxarota_audio_sources for all
  to authenticated
  using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

create or replace function public.get_puxarota_audio_playback(p_audio_id uuid)
returns table (source_type text, source_value text)
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
    and published_at is not null
    and published_at <= now();

  if not found then
    return;
  end if;

  allowed := requested.access_level = 'free';

  if auth.uid() is not null then
    allowed := allowed
      or public.is_puxarota_admin(auth.uid())
      or exists (
        select 1
        from public.puxarota_accounts account
        where account.user_id = auth.uid()
          and (account.license_status in ('trial','active') or account.subscription_status = 'active')
      );
  end if;

  if not allowed then
    return;
  end if;

  return query
  select source.source_type, source.source_value
  from public.puxarota_audio_sources source
  where source.audio_id = p_audio_id;
end;
$$;

revoke all on function public.get_puxarota_audio_playback(uuid) from public;
grant execute on function public.get_puxarota_audio_playback(uuid) to anon, authenticated;
