-- Caixa de entrada: sugestoes de tema, problemas, melhorias e respostas

create table if not exists public.puxarota_user_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message_type text not null check (message_type in ('theme_suggestion','problem','improvement','other')),
  subject text,
  message text not null check (char_length(message) between 8 and 1200),
  contact text,
  context text not null default 'app' check (context in ('app','radio')),
  status text not null default 'new' check (status in ('new','reviewing','planned','resolved','archived')),
  admin_reply text,
  replied_at timestamptz,
  replied_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.puxarota_user_messages enable row level security;

drop policy if exists "anyone can send a user message" on public.puxarota_user_messages;
create policy "anyone can send a user message"
  on public.puxarota_user_messages for insert
  to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and status = 'new'
    and admin_reply is null
    and replied_at is null
    and replied_by is null
  );

drop policy if exists "owners read their messages and replies" on public.puxarota_user_messages;
create policy "owners read their messages and replies"
  on public.puxarota_user_messages for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "admins manage user messages" on public.puxarota_user_messages;
create policy "admins manage user messages"
  on public.puxarota_user_messages for all
  to authenticated
  using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

create index if not exists puxarota_user_messages_admin_idx
  on public.puxarota_user_messages (status, created_at desc);
