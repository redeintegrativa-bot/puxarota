-- Preparação futura: ainda não conectado ao frontend.
-- Não armazenar dados antes de definir consentimento, política de privacidade e fluxo administrativo.
create table if not exists public.transportadora_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  whatsapp text not null,
  region text,
  vehicle_types text,
  route_description text,
  expires_at date,
  status text not null default 'pending' check (status in ('pending','approved','expired','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.motorista_leads (
  id uuid primary key default gen_random_uuid(),
  contact_name text,
  whatsapp text not null,
  region text,
  vehicle text not null,
  cargo_preference text,
  needs_helper boolean,
  status text not null default 'pending' check (status in ('pending','contacted','archived')),
  created_at timestamptz not null default now()
);

alter table public.transportadora_leads enable row level security;
alter table public.transportadora_leads force row level security;
alter table public.motorista_leads enable row level security;
alter table public.motorista_leads force row level security;
-- Inserção pública deve ser feita por Edge Function/serverless com rate limit e captcha.
drop policy if exists "admins can manage transportadora leads" on public.transportadora_leads;
create policy "admins can manage transportadora leads" on public.transportadora_leads for all to authenticated using (public.is_puxarota_admin((SELECT auth.uid()))) with check (public.is_puxarota_admin((SELECT auth.uid())));
drop policy if exists "admins can manage motorista leads" on public.motorista_leads;
create policy "admins can manage motorista leads" on public.motorista_leads for all to authenticated using (public.is_puxarota_admin((SELECT auth.uid()))) with check (public.is_puxarota_admin((SELECT auth.uid())));
-- Não criar policy pública ampla antes do endpoint seguro existir.


create table if not exists public.puxarota_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  profile_type text not null check (profile_type in ('driver','helper','company')),
  display_name text not null,
  whatsapp text not null,
  region text,
  postal_code text,
  vehicle text,
  license_category text,
  cargo_preference text,
  availability text,
  public_visible boolean not null default false,
  consent_public boolean not null default false,
  contact_release text not null default 'pending' check (contact_release in ('pending','allowed','denied')),
  contact_release_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  source text not null default 'local_admin',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table if exists public.puxarota_interests add column if not exists interaction_stage text not null default 'conversation';
alter table if exists public.puxarota_reviews add column if not exists review_context text not null default 'conversation';
alter table if exists public.puxarota_accounts add column if not exists credits_balance integer not null default 0;
alter table if exists public.puxarota_accounts add column if not exists credits_granted integer not null default 0;
alter table if exists public.puxarota_accounts add column if not exists credits_used integer not null default 0;
alter table if exists public.puxarota_accounts add column if not exists credits_updated_at timestamptz;
alter table if exists public.puxarota_accounts add column if not exists email_snapshot text;
-- Migração segura para projetos que já tinham a tabela criada
alter table if exists public.puxarota_profiles add column if not exists consent_data boolean not null default false;
alter table if exists public.puxarota_profiles add column if not exists consent_data_at timestamptz;
alter table if exists public.puxarota_profiles add column if not exists privacy_version text;
alter table if exists public.puxarota_profiles add column if not exists user_id uuid unique references auth.users(id) on delete cascade;
alter table if exists public.puxarota_profiles add column if not exists license_category text;

create table if not exists public.puxarota_interests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.puxarota_profiles(id) on delete set null,
  opportunity_id text,
  requester_name text not null,
  requester_whatsapp text not null,
  requester_type text not null check (requester_type in ('driver','helper','company')),
  region text,
  message text,
  interaction_stage text not null default 'conversation' check (interaction_stage in ('conversation','work_completed')),
  consent_contact boolean not null default false,
  status text not null default 'new' check (status in ('new','contacted','closed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.puxarota_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewed_profile_id uuid not null references public.puxarota_profiles(id) on delete cascade,
  interest_id uuid references public.puxarota_interests(id) on delete set null,
  reviewer_name text,
  score integer not null check (score between 1 and 5),
  criteria jsonb not null default '{}'::jsonb,
  review_context text not null default 'conversation' check (review_context in ('conversation','work_completed')),
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','hidden','reported')),
  consent_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.puxarota_profiles enable row level security;
alter table public.puxarota_profiles force row level security;
alter table public.puxarota_interests enable row level security;
alter table public.puxarota_interests force row level security;
alter table public.puxarota_reviews enable row level security;
alter table public.puxarota_reviews force row level security;
drop policy if exists "admins can manage reviews" on public.puxarota_reviews;
create policy "admins can manage reviews" on public.puxarota_reviews for all to authenticated using (public.is_puxarota_admin((SELECT auth.uid()))) with check (public.is_puxarota_admin((SELECT auth.uid())));

create table if not exists public.puxarota_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('driver','helper','company','admin')),
  display_name text,
  phone text,
  license_status text not null default 'free' check (license_status in ('free','trial','active','past_due','cancelled')),
  license_plan text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.puxarota_accounts enable row level security;
alter table public.puxarota_accounts force row level security;

create index if not exists puxarota_profiles_region_idx on public.puxarota_profiles (region);
create index if not exists puxarota_profiles_status_idx on public.puxarota_profiles (status, public_visible);
create index if not exists puxarota_interests_status_idx on public.puxarota_interests (status);

create table if not exists public.puxarota_notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.puxarota_accounts(user_id) on delete set null,
  interest_id uuid references public.puxarota_interests(id) on delete set null,
  channel text not null check (channel in ('telegram_admin','whatsapp_manual','in_app')),
  status text not null default 'pending' check (status in ('pending','prepared','sent','failed')),
  message text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.puxarota_notifications enable row level security;
alter table public.puxarota_notifications force row level security;

-- Oportunidades encontradas pelo coletor entram nesta fila antes de qualquer
-- exibição pública. A fonte e os detalhes são públicos; a decisão é restrita
-- à conta administrativa aprovada.
create table if not exists public.puxarota_opportunities (
  id text primary key,
  company text not null,
  title text not null,
  source text not null,
  source_url text not null,
  origin text,
  area text,
  vehicles jsonb not null default '[]'::jsonb,
  model text,
  routine text,
  payment text,
  detail text,
  confidence integer,
  discovered_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

alter table public.puxarota_opportunities enable row level security;
alter table public.puxarota_opportunities force row level security;
create index if not exists puxarota_opportunities_status_idx on public.puxarota_opportunities (status, discovered_at desc);

create or replace function public.is_puxarota_admin(check_user uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.puxarota_accounts
    where user_id = check_user and account_type = 'admin' and is_approved = true
  );
$$;

revoke all on function public.is_puxarota_admin(uuid) from public;
grant execute on function public.is_puxarota_admin(uuid) to authenticated;

drop policy if exists "account owner can read own account" on public.puxarota_accounts;
create policy "account owner can read own account"
  on public.puxarota_accounts for select
  to authenticated using (user_id = (SELECT auth.uid()));

drop policy if exists "admins can manage accounts" on public.puxarota_accounts;
create policy "admins can manage accounts"
  on public.puxarota_accounts for all
  to authenticated using (public.is_puxarota_admin((SELECT auth.uid())))
  with check (public.is_puxarota_admin((SELECT auth.uid())));

drop policy if exists "admins can manage profiles" on public.puxarota_profiles;
create policy "admins can manage profiles"
  on public.puxarota_profiles for all
  to authenticated using (public.is_puxarota_admin((SELECT auth.uid())))
  with check (public.is_puxarota_admin((SELECT auth.uid())));

drop policy if exists "approved profiles are public" on public.puxarota_profiles;
drop policy if exists "profile owner can manage own profile" on public.puxarota_profiles;
create policy "profile owner can manage own profile"
  on public.puxarota_profiles for all
  to authenticated using (user_id = (SELECT auth.uid()))
  with check (user_id = (SELECT auth.uid()));

create policy "approved profiles are public"
  on public.puxarota_profiles for select
  to anon, authenticated using (status = 'approved' and public_visible = true and consent_public = true);

drop policy if exists "admins can manage interests" on public.puxarota_interests;
create policy "admins can manage interests"
  on public.puxarota_interests for all
  to authenticated using (public.is_puxarota_admin((SELECT auth.uid())))
  with check (public.is_puxarota_admin((SELECT auth.uid())));

drop policy if exists "profile owner can create own interests" on public.puxarota_interests;
create policy "profile owner can create own interests"
  on public.puxarota_interests for insert
  to authenticated with check (
    exists (select 1 from public.puxarota_profiles where id = profile_id and user_id = (SELECT auth.uid()))
  );

drop policy if exists "admins can manage notifications" on public.puxarota_notifications;
create policy "admins can manage notifications"
  on public.puxarota_notifications for all
  to authenticated using (public.is_puxarota_admin((SELECT auth.uid())))
  with check (public.is_puxarota_admin((SELECT auth.uid())));

drop policy if exists "admins can manage opportunities" on public.puxarota_opportunities;
create policy "admins can manage opportunities"
  on public.puxarota_opportunities for all
  to authenticated using (public.is_puxarota_admin((SELECT auth.uid())))
  with check (public.is_puxarota_admin((SELECT auth.uid())));

drop policy if exists "approved opportunities are public" on public.puxarota_opportunities;
create policy "approved opportunities are public"
  on public.puxarota_opportunities for select
  to anon, authenticated using (status = 'approved');

create or replace function public.handle_new_puxarota_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.puxarota_accounts (user_id, account_type, display_name, email_snapshot)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'account_type', 'driver'),
    nullif(new.raw_user_meta_data->>'display_name', ''),
    new.email
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_puxarota on auth.users;
create trigger on_auth_user_created_puxarota
  after insert on auth.users
  for each row execute procedure public.handle_new_puxarota_user();

-- Fila interna para o Genesio/Telegram
create or replace function public.queue_puxarota_profile_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.puxarota_notifications (account_id, channel, status, message)
  values (
    new.user_id,
    'telegram_admin',
    'pending',
    'Novo cadastro no PuxaRota: ' || coalesce(new.display_name, 'sem nome') || ' | perfil: ' || new.profile_type || ' | região: ' || coalesce(new.region, 'não informada') || ' | veículo: ' || coalesce(new.vehicle, 'não informado')
  );
  return new;
end;
$$;

drop trigger if exists on_puxarota_profile_created on public.puxarota_profiles;
create trigger on_puxarota_profile_created
  after insert on public.puxarota_profiles
  for each row execute procedure public.queue_puxarota_profile_notification();

create or replace function public.queue_puxarota_interest_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.puxarota_notifications (account_id, interest_id, channel, status, message)
  select p.user_id, new.id, 'telegram_admin', 'pending',
    'Novo interesse no PuxaRota: ' || coalesce(new.requester_name, 'sem nome') ||
    ' | oportunidade: ' || coalesce(o.company, new.opportunity_id, 'não informada') ||
    ' | região: ' || coalesce(new.region, 'não informada')
  from public.puxarota_profiles p
  left join public.puxarota_opportunities o on o.id = new.opportunity_id
  where p.id = new.profile_id;
  return new;
end;
$$;

drop trigger if exists on_puxarota_interest_created on public.puxarota_interests;
create trigger on_puxarota_interest_created
  after insert on public.puxarota_interests
  for each row execute procedure public.queue_puxarota_interest_notification();

create or replace function public.queue_puxarota_profile_approval_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    insert into public.puxarota_notifications (account_id, channel, status, message)
    values (new.user_id, 'in_app', 'pending', 'Seu perfil foi aprovado no PuxaRota. O contato só será liberado com sua autorização.');
    insert into public.puxarota_notifications (account_id, channel, status, message)
    values (new.user_id, 'whatsapp_manual', 'prepared', 'Olá! Seu perfil foi aprovado no PuxaRota. Podemos avisar quando houver interesse de uma empresa.');
    insert into public.puxarota_notifications (channel, status, message)
    values ('telegram_admin', 'pending', 'Perfil aprovado no PuxaRota: ' || coalesce(new.display_name, 'sem nome') || ' | contato ainda protegido');
  end if;
  return new;
end;
$$;

drop trigger if exists on_puxarota_profile_approved on public.puxarota_profiles;
create trigger on_puxarota_profile_approved
  after update of status on public.puxarota_profiles
  for each row execute procedure public.queue_puxarota_profile_approval_notification();


drop policy if exists "account owner can read own notifications" on public.puxarota_notifications;
create policy "account owner can read own notifications"
  on public.puxarota_notifications for select
  to authenticated using (account_id = (SELECT auth.uid()));

create table if not exists public.puxarota_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.puxarota_accounts(user_id) on delete cascade,
  profile_id uuid references public.puxarota_profiles(id) on delete set null,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.puxarota_credit_transactions enable row level security;
alter table public.puxarota_credit_transactions force row level security;
drop policy if exists "account owner can read own credit history" on public.puxarota_credit_transactions;
create policy "account owner can read own credit history" on public.puxarota_credit_transactions for select to authenticated using (account_id = (SELECT auth.uid()));
drop policy if exists "admins can manage credit history" on public.puxarota_credit_transactions;
create policy "admins can manage credit history" on public.puxarota_credit_transactions for all to authenticated using (public.is_puxarota_admin((SELECT auth.uid()))) with check (public.is_puxarota_admin((SELECT auth.uid())));
