-- Atualiza o primeiro episodio sem publica-lo: a aprovacao continua no admin.

update public.puxarota_audio_items
set
  title = 'O Dia Que Ele Disse ''Não'' Pra Carga',
  teaser = 'Fácil demais. Sem documento. Sem nota.',
  cover_path = 'static:radio-covers/o-dia-que-ele-disse-nao-pra-carga.png',
  duration_seconds = 286,
  updated_at = now()
where id = 'a101c46e-692f-4d36-9dd5-7eef12c62c1a';
