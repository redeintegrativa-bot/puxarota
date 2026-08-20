-- Primeiro episodio real da Radio, mantido como rascunho ate aprovacao do admin.

insert into public.puxarota_audio_items (
  id,
  kind,
  title,
  teaser,
  synopsis,
  season_title,
  season_number,
  episode_number,
  access_level,
  status,
  created_by
)
values (
  'a101c46e-692f-4d36-9dd5-7eef12c62c1a',
  'story',
  'Carga boa demais',
  'Facil demais. Sem documento. Sem nota.',
  'Uma carga que parece simples demais coloca a estrada, a escolha e as consequencias no centro da historia.',
  'Historias da Estrada',
  1,
  1,
  'free',
  'draft',
  (select id from auth.users where lower(email) = 'redeintegrativa@gmail.com' limit 1)
)
on conflict (id) do update set
  title = excluded.title,
  teaser = excluded.teaser,
  synopsis = excluded.synopsis,
  season_title = excluded.season_title,
  season_number = excluded.season_number,
  episode_number = excluded.episode_number,
  access_level = excluded.access_level,
  updated_at = now();

insert into public.puxarota_audio_sources (audio_id, source_type, source_value)
values (
  'a101c46e-692f-4d36-9dd5-7eef12c62c1a',
  'google_drive',
  'https://drive.google.com/file/d/1qi7VWrJlnMoT74HvgMeCPv1yP2fNYcml/view?usp=drive_link'
)
on conflict (audio_id) do update set
  source_type = excluded.source_type,
  source_value = excluded.source_value,
  updated_at = now();
