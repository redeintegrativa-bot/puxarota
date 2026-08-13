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
alter table public.motorista_leads enable row level security;
-- Inserção pública deve ser feita por Edge Function/serverless com rate limit e captcha.
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

-- Migração segura para projetos que já tinham a tabela criada
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
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','hidden','reported')),
  consent_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.puxarota_profiles enable row level security;
alter table public.puxarota_interests enable row level security;
alter table public.puxarota_reviews enable row level security;

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

create index if not exists puxarota_profiles_region_idx on public.puxarota_profiles (region);
create index if not exists puxarota_profiles_status_idx on public.puxarota_profiles (status, public_visible);
create index if not exists puxarota_interests_status_idx on public.puxarota_interests (status);

create table if not exists public.puxarota_notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.puxarota_accounts(user_id) on delete set null,
  interest_id uuid references public.puxarota_interests(id) on delete set null,
  channel text not null check (channel in ('telegram_admin','whatsapp_manual')),
  status text not null default 'pending' check (status in ('pending','prepared','sent','failed')),
  message text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.puxarota_notifications enable row level security;

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
  to authenticated using (user_id = auth.uid());

drop policy if exists "admins can manage accounts" on public.puxarota_accounts;
create policy "admins can manage accounts"
  on public.puxarota_accounts for all
  to authenticated using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

drop policy if exists "admins can manage profiles" on public.puxarota_profiles;
create policy "admins can manage profiles"
  on public.puxarota_profiles for all
  to authenticated using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

drop policy if exists "approved profiles are public" on public.puxarota_profiles;
drop policy if exists "profile owner can manage own profile" on public.puxarota_profiles;
create policy "profile owner can manage own profile"
  on public.puxarota_profiles for all
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "approved profiles are public"
  on public.puxarota_profiles for select
  to anon, authenticated using (status = 'approved' and public_visible = true and consent_public = true);

drop policy if exists "admins can manage interests" on public.puxarota_interests;
create policy "admins can manage interests"
  on public.puxarota_interests for all
  to authenticated using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

drop policy if exists "admins can manage notifications" on public.puxarota_notifications;
create policy "admins can manage notifications"
  on public.puxarota_notifications for all
  to authenticated using (public.is_puxarota_admin(auth.uid()))
  with check (public.is_puxarota_admin(auth.uid()));

create or replace function public.handle_new_puxarota_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.puxarota_accounts (user_id, account_type, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'account_type', 'driver'),
    nullif(new.raw_user_meta_data->>'display_name', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_puxarota on auth.users;
create trigger on_auth_user_created_puxarota
  after insert on auth.users
  for each row execute procedure public.handle_new_puxarota_user();
