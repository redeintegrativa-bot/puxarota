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
  profile_type text not null check (profile_type in ('driver','helper','company')),
  display_name text not null,
  whatsapp text not null,
  region text,
  postal_code text,
  vehicle text,
  cargo_preference text,
  availability text,
  public_visible boolean not null default false,
  consent_public boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  source text not null default 'local_admin',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

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
