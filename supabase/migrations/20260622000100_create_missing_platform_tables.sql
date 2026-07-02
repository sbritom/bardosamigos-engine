-- Bar dos Amigos Engine - complementary missing platform tables.
-- Safe for a remote database that already has legacy tables such as public.tv_channels.
-- This migration intentionally does not drop, recreate, or alter existing tables.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'moderator', 'admin', 'super_admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'published', 'archived', 'hidden');
  end if;
  if not exists (select 1 from pg_type where typname = 'wallet_transaction_type') then
    create type public.wallet_transaction_type as enum ('earn', 'spend', 'refund', 'adjustment', 'reward');
  end if;
  if not exists (select 1 from pg_type where typname = 'wallet_transaction_status') then
    create type public.wallet_transaction_status as enum ('pending', 'confirmed', 'failed', 'canceled');
  end if;
  if not exists (select 1 from pg_type where typname = 'competition_type') then
    create type public.competition_type as enum ('football', 'basketball', 'volleyball', 'formula_1', 'ufc', 'esports', 'reality_show', 'custom');
  end if;
  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type public.match_status as enum ('scheduled', 'open', 'live', 'finished', 'canceled', 'postponed');
  end if;
  if not exists (select 1 from pg_type where typname = 'prediction_status') then
    create type public.prediction_status as enum ('draft', 'confirmed', 'locked', 'scored', 'canceled');
  end if;
  if not exists (select 1 from pg_type where typname = 'reward_type') then
    create type public.reward_type as enum ('badge', 'barcoins', 'coupon', 'store_item', 'experience', 'custom');
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  birth_date date,
  phone text,
  role public.app_role not null default 'user',
  status text not null default 'active',
  preferences jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.profile_stats (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level integer not null default 1,
  xp integer not null default 0,
  total_barcoins bigint not null default 0,
  total_predictions integer not null default 0,
  total_wins integer not null default 0,
  ranking_score numeric(12,2) not null default 0,
  last_activity_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id)
);

create table if not exists public.profile_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id, scope)
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.admin_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id, role_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_type text not null default 'system',
  action text not null,
  entity_table text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.barai_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  context_scope text not null default 'global',
  personality text not null default 'friendly',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.barai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.barai_sessions(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  role text not null,
  content text not null,
  sanitized_content text,
  provider text not null default 'local',
  model text,
  tokens_input integer not null default 0,
  tokens_output integer not null default 0,
  risk_level text not null default 'low',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.barai_memory (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  scope text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  source_module text,
  sensitivity_level text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.barai_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.barai_messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  type public.competition_type not null default 'custom',
  description text,
  status public.content_status not null default 'draft',
  settings jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  external_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null,
  slug text not null,
  status public.content_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_stages (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.competition_seasons(id) on delete cascade,
  name text not null,
  stage_type text not null default 'regular',
  stage_order integer not null default 1,
  status public.content_status not null default 'draft',
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_rounds (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.competition_stages(id) on delete cascade,
  name text not null,
  number integer not null default 1,
  status public.content_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  name text not null,
  short_name text,
  logo_url text,
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.competition_rounds(id) on delete cascade,
  home_participant text,
  away_participant text,
  starts_at timestamptz not null,
  status public.match_status not null default 'scheduled',
  result jsonb not null default '{}'::jsonb,
  external_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.competition_matches(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  prediction jsonb not null default '{}'::jsonb,
  status public.prediction_status not null default 'confirmed',
  points integer not null default 0,
  locked_at timestamptz,
  scored_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_score_rules (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  type text not null,
  points integer not null default 0,
  conditions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_rankings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  season_id uuid references public.competition_seasons(id) on delete cascade,
  scope text not null default 'season',
  generated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.competition_ranking_items (
  id uuid primary key default gen_random_uuid(),
  ranking_id uuid not null references public.competition_rankings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  position integer not null,
  points integer not null default 0,
  exact_hits integer not null default 0,
  result_hits integer not null default 0,
  predictions_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.competition_rewards (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  type public.reward_type not null default 'custom',
  title text not null,
  description text,
  payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.competition_achievements (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  criteria jsonb not null default '{}'::jsonb,
  reward_id uuid references public.competition_rewards(id) on delete set null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.profile_achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.competition_achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (profile_id, achievement_id)
);

create table if not exists public.barcoin_wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  balance bigint not null default 0,
  locked_balance bigint not null default 0,
  lifetime_earned bigint not null default 0,
  lifetime_spent bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id)
);

create table if not exists public.barcoin_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.barcoin_wallets(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type public.wallet_transaction_type not null,
  amount bigint not null,
  status public.wallet_transaction_status not null default 'pending',
  source_module text,
  source_id uuid,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.barcoin_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_module text not null,
  event_type text not null,
  amount bigint not null default 0,
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  image_url text,
  price_barcoins bigint not null default 0,
  stock_quantity integer,
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  total_barcoins bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders(id) on delete cascade,
  product_id uuid references public.store_products(id) on delete set null,
  quantity integer not null default 1,
  unit_price_barcoins bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.store_redemptions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.store_orders(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  code text,
  redeemed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  status public.content_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  reward jsonb not null default '{}'::jsonb,
  rules jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.profile_missions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  status text not null default 'active',
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id, mission_id)
);

create table if not exists public.ranking_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  scope text not null default 'global',
  status public.content_status not null default 'draft',
  rules jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.ranking_entries (
  id uuid primary key default gen_random_uuid(),
  ranking_board_id uuid references public.ranking_boards(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  position integer not null default 0,
  score numeric(12,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  source_module text not null,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.extensions (
  id uuid primary key default gen_random_uuid(),
  extension_key text not null,
  name text not null,
  version text not null default '1.0.0',
  status text not null default 'installed',
  manifest jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.extension_permissions (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid references public.extensions(id) on delete cascade,
  permission_key text not null,
  granted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.extension_events (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid references public.extensions(id) on delete cascade,
  event_name text not null,
  direction text not null default 'emit',
  payload_schema jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.radio_stations (
  id uuid primary key default gen_random_uuid(),
  name text,
  slug text,
  stream_url text,
  cover_url text,
  status public.content_status default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.news_categories (
  id uuid primary key default gen_random_uuid(),
  name text,
  slug text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.news_categories(id) on delete set null,
  author_profile_id uuid references public.profiles(id) on delete set null,
  title text,
  slug text,
  summary text,
  content text,
  cover_url text,
  status public.content_status default 'draft',
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text,
  slug text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.content_status default 'draft',
  capacity integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create unique index if not exists profiles_username_active_idx on public.profiles (lower(username)) where username is not null and deleted_at is null;
create unique index if not exists competitions_slug_active_idx on public.competitions (slug) where deleted_at is null;
create index if not exists competition_matches_round_status_idx on public.competition_matches (round_id, status, starts_at);
create index if not exists competition_teams_competition_idx on public.competition_teams (competition_id, name);
create index if not exists analytics_events_module_idx on public.analytics_events (source_module, occurred_at desc);
create index if not exists news_articles_status_idx on public.news_articles (status, published_at desc);
create index if not exists radio_stations_slug_idx on public.radio_stations (slug);
