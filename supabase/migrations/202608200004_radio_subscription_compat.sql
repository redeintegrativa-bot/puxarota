-- Compatibilidade temporaria enquanto license_status e subscription_status coexistem.
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
                  and (
                    account.license_status in ('trial','active')
                    or account.subscription_status = 'active'
                  )
              )
            )
          )
        )
    )
  );
