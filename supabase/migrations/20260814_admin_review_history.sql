-- Fila administrativa: ocultar sem apagar e manter ações reversíveis.
alter table public.puxarota_accounts add column if not exists admin_dismissed_at timestamptz;

create table if not exists public.puxarota_admin_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.puxarota_accounts(user_id) on delete set null,
  profile_id uuid references public.puxarota_profiles(id) on delete set null,
  action text not null check (action in ('approved','rejected','dismissed','restored','reopened')),
  note text,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.puxarota_admin_history enable row level security;
drop policy if exists "admins can manage admin history" on public.puxarota_admin_history;
create policy "admins can manage admin history" on public.puxarota_admin_history for all to authenticated
using (public.is_puxarota_admin(auth.uid())) with check (public.is_puxarota_admin(auth.uid()));
