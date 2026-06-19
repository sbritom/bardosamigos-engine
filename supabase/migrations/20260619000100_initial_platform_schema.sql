-- Bar dos Amigos Engine - Initial Supabase/PostgreSQL schema
-- Fase 6: persistence layer

create extension if not exists "pgcrypto";

create type public.app_role as enum ('user', 'moderator', 'admin', 'super_admin');
create type public.content_status as enum ('draft', 'published', 'archived', 'hidden');
create type public.wallet_transaction_type as enum ('earn', 'spend', 'refund', 'adjustment', 'reward');
create type public.wallet_transaction_status as enum ('pending', 'confirmed', 'failed', 'canceled');
create type public.competition_type as enum ('football', 'basketball', 'volleyball', 'formula_1', 'ufc', 'esports', 'reality_show', 'custom');
create type public.match_status as enum ('scheduled', 'open', 'live', 'finished', 'canceled', 'postponed');
create type public.prediction_status as enum ('draft', 'confirmed', 'locked', 'scored', 'canceled');
create type public.reward_type as enum ('badge', 'barcoins', 'coupon', 'store_item', 'experience', 'custom');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.version = coalesce(old.version, 0) + 1;
  return new;
end;
$$;

create table public.profiles (
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
  version integer not null default 1,
  constraint profiles_username_len check (username is null or char_length(username) >= 3)
);

create table public.profile_stats (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
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

create table public.profile_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id, scope)
);

create table public.admin_roles (
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

create table public.admin_assignments (
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

create table public.audit_logs (
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

create table public.admin_actions (
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

create table public.barai_sessions (
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

create table public.barai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.barai_sessions(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
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

create table public.barai_memory (
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

create table public.barai_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.barai_messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  type public.competition_type not null default 'custom',
  description text,
  status public.content_status not null default 'draft',
  settings jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.competition_seasons (
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

create table public.competition_stages (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.competition_seasons(id) on delete cascade,
  name text not null,
  stage_type text not null default 'regular',
  "order" integer not null default 1,
  status public.content_status not null default 'draft',
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.competition_rounds (
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

create table public.competition_matches (
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

create table public.competition_predictions (
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

create table public.competition_score_rules (
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

create table public.competition_rankings (
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

create table public.competition_ranking_items (
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

create table public.competition_rewards (
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

create table public.competition_achievements (
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

create table public.profile_achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.competition_achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (profile_id, achievement_id)
);

create table public.barcoin_wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  balance bigint not null default 0,
  locked_balance bigint not null default 0,
  lifetime_earned bigint not null default 0,
  lifetime_spent bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id),
  constraint wallet_non_negative check (balance >= 0 and locked_balance >= 0)
);

create table public.barcoin_transactions (
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

create table public.barcoin_rules (
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

create table public.store_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  type text not null default 'digital',
  price_barcoins bigint not null default 0,
  price_money numeric(12,2) not null default 0,
  stock_quantity integer,
  status public.content_status not null default 'draft',
  images jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.store_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  total_barcoins bigint not null default 0,
  total_money numeric(12,2) not null default 0,
  payment_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_barcoins bigint not null default 0,
  unit_price_money numeric(12,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.store_redemptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete cascade,
  order_id uuid references public.store_orders(id) on delete set null,
  status text not null default 'pending',
  redeemed_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  description text,
  type text not null,
  criteria jsonb not null default '{}'::jsonb,
  reward jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.profile_missions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  completed_at timestamptz,
  reward_claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (profile_id, mission_id)
);

create table public.ranking_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  scope text not null default 'global',
  source_module text not null,
  period text not null default 'all_time',
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.ranking_entries (
  id uuid primary key default gen_random_uuid(),
  ranking_board_id uuid not null references public.ranking_boards(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  position integer not null,
  score numeric(14,2) not null default 0,
  data jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table public.tv_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  stream_url text,
  thumbnail_url text,
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.tv_programs (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.tv_channels(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.tv_watch_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  channel_id uuid not null references public.tv_channels(id) on delete cascade,
  program_id uuid references public.tv_programs(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table public.radio_stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  stream_url text,
  cover_url text,
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.radio_tracks (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.radio_stations(id) on delete cascade,
  title text not null,
  artist text,
  album text,
  played_at timestamptz not null default now(),
  duration_seconds integer,
  metadata jsonb not null default '{}'::jsonb
);

create table public.radio_listen_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  station_id uuid not null references public.radio_stations(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table public.news_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.news_categories(id) on delete set null,
  author_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null,
  summary text,
  content text,
  cover_url text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.news_interactions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.content_status not null default 'draft',
  capacity integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'registered',
  checked_in_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (event_id, profile_id)
);

create table public.system_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  source_module text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  module text not null,
  enabled boolean not null default false,
  rules jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  scope text not null default 'global',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create table public.file_assets (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  bucket text not null,
  path text not null,
  url text,
  mime_type text,
  size_bytes bigint,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index profiles_username_active_idx on public.profiles (lower(username)) where username is not null and deleted_at is null;
create unique index competitions_slug_active_idx on public.competitions (slug) where deleted_at is null;
create unique index competition_seasons_slug_idx on public.competition_seasons (competition_id, slug) where deleted_at is null;
create unique index competition_predictions_unique_active_idx on public.competition_predictions (match_id, profile_id) where deleted_at is null;
create unique index store_products_slug_active_idx on public.store_products (slug) where deleted_at is null;
create unique index missions_slug_active_idx on public.missions (slug) where deleted_at is null;
create unique index ranking_boards_slug_active_idx on public.ranking_boards (slug) where deleted_at is null;
create unique index tv_channels_slug_active_idx on public.tv_channels (slug) where deleted_at is null;
create unique index radio_stations_slug_active_idx on public.radio_stations (slug) where deleted_at is null;
create unique index news_categories_slug_active_idx on public.news_categories (slug) where deleted_at is null;
create unique index news_articles_slug_active_idx on public.news_articles (slug) where deleted_at is null;
create unique index events_slug_active_idx on public.events (slug) where deleted_at is null;

create index audit_logs_entity_idx on public.audit_logs (entity_table, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_profile_id, created_at desc);
create index admin_actions_entity_idx on public.admin_actions (entity_type, entity_id);
create index barai_messages_session_idx on public.barai_messages (session_id, created_at);
create index barai_memory_scope_idx on public.barai_memory (profile_id, scope, key);
create index competition_matches_round_status_idx on public.competition_matches (round_id, status, starts_at);
create index competition_rank_items_position_idx on public.competition_ranking_items (ranking_id, position);
create index barcoin_transactions_profile_idx on public.barcoin_transactions (profile_id, created_at desc);
create index store_orders_profile_idx on public.store_orders (profile_id, created_at desc);
create index profile_missions_status_idx on public.profile_missions (profile_id, status);
create index ranking_entries_board_position_idx on public.ranking_entries (ranking_board_id, position);
create index news_articles_published_idx on public.news_articles (status, published_at desc);
create index system_events_status_idx on public.system_events (status, created_at);
create index file_assets_entity_idx on public.file_assets (entity_type, entity_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at is null
      and p.role in ('admin', 'super_admin')
  );
$$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  actor := auth.uid();

  insert into public.audit_logs (
    actor_profile_id,
    actor_type,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data
  )
  values (
    actor,
    case when actor is null then 'system' else 'user' end,
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    null
  )
  on conflict (id) do nothing;

  insert into public.profile_stats (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  insert into public.barcoin_wallets (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','profile_stats','profile_preferences','admin_roles','admin_assignments',
    'barai_sessions','barai_messages','barai_memory','competitions','competition_seasons',
    'competition_stages','competition_rounds','competition_matches','competition_predictions',
    'competition_score_rules','competition_rankings','competition_ranking_items',
    'competition_rewards','competition_achievements','barcoin_wallets','barcoin_transactions',
    'barcoin_rules','store_products','store_orders','store_redemptions','missions',
    'profile_missions','ranking_boards','ranking_entries','tv_channels','tv_programs',
    'radio_stations','news_categories','news_articles','events','event_registrations',
    'feature_flags','app_settings','file_assets'
  ]
  loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','admin_roles','admin_assignments','barai_sessions','barai_messages',
    'barai_memory','competitions','competition_predictions','barcoin_wallets',
    'barcoin_transactions','store_orders','store_redemptions','missions',
    'profile_missions','feature_flags','app_settings'
  ]
  loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_row_change()', table_name, table_name);
  end loop;
end;
$$;

create view public.public_news_articles as
select id, category_id, title, slug, summary, cover_url, published_at, metadata
from public.news_articles
where status = 'published' and deleted_at is null;

create view public.public_competitions as
select id, name, slug, type, description, status, starts_at, ends_at, metadata
from public.competitions
where status = 'published' and deleted_at is null;

create view public.public_events as
select id, title, slug, description, location, starts_at, ends_at, capacity, metadata
from public.events
where status = 'published' and deleted_at is null;

alter table public.profiles enable row level security;
alter table public.profile_stats enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_assignments enable row level security;
alter table public.admin_actions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.barai_sessions enable row level security;
alter table public.barai_messages enable row level security;
alter table public.barai_memory enable row level security;
alter table public.barai_feedback enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_seasons enable row level security;
alter table public.competition_stages enable row level security;
alter table public.competition_rounds enable row level security;
alter table public.competition_matches enable row level security;
alter table public.competition_predictions enable row level security;
alter table public.competition_score_rules enable row level security;
alter table public.competition_rankings enable row level security;
alter table public.competition_ranking_items enable row level security;
alter table public.competition_rewards enable row level security;
alter table public.competition_achievements enable row level security;
alter table public.profile_achievements enable row level security;
alter table public.barcoin_wallets enable row level security;
alter table public.barcoin_transactions enable row level security;
alter table public.barcoin_rules enable row level security;
alter table public.store_products enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;
alter table public.store_redemptions enable row level security;
alter table public.missions enable row level security;
alter table public.profile_missions enable row level security;
alter table public.ranking_boards enable row level security;
alter table public.ranking_entries enable row level security;
alter table public.tv_channels enable row level security;
alter table public.tv_programs enable row level security;
alter table public.tv_watch_events enable row level security;
alter table public.radio_stations enable row level security;
alter table public.radio_tracks enable row level security;
alter table public.radio_listen_events enable row level security;
alter table public.news_categories enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_interactions enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.system_events enable row level security;
alter table public.feature_flags enable row level security;
alter table public.app_settings enable row level security;
alter table public.file_assets enable row level security;

create policy "profiles read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "profile stats read own or admin" on public.profile_stats for select using (profile_id = auth.uid() or public.is_admin());
create policy "profile preferences own" on public.profile_preferences for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

create policy "admin roles read admins" on public.admin_roles for select using (public.is_admin());
create policy "admin roles write admins" on public.admin_roles for all using (public.is_admin()) with check (public.is_admin());
create policy "admin assignments admins" on public.admin_assignments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin actions admins" on public.admin_actions for select using (public.is_admin());
create policy "audit logs admins" on public.audit_logs for select using (public.is_admin());

create policy "barai sessions own" on public.barai_sessions for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
create policy "barai messages own" on public.barai_messages for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
create policy "barai memory own" on public.barai_memory for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
create policy "barai feedback own" on public.barai_feedback for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

create policy "published competitions readable" on public.competitions for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "competition hierarchy readable" on public.competition_seasons for select using (deleted_at is null or public.is_admin());
create policy "competition stages readable" on public.competition_stages for select using (deleted_at is null or public.is_admin());
create policy "competition rounds readable" on public.competition_rounds for select using (deleted_at is null or public.is_admin());
create policy "competition matches readable" on public.competition_matches for select using (deleted_at is null or public.is_admin());
create policy "competition admin writes" on public.competitions for all using (public.is_admin()) with check (public.is_admin());
create policy "competition seasons admin writes" on public.competition_seasons for all using (public.is_admin()) with check (public.is_admin());
create policy "competition stages admin writes" on public.competition_stages for all using (public.is_admin()) with check (public.is_admin());
create policy "competition rounds admin writes" on public.competition_rounds for all using (public.is_admin()) with check (public.is_admin());
create policy "competition matches admin writes" on public.competition_matches for all using (public.is_admin()) with check (public.is_admin());
create policy "predictions own read" on public.competition_predictions for select using (profile_id = auth.uid() or public.is_admin());
create policy "predictions own insert" on public.competition_predictions for insert with check (profile_id = auth.uid());
create policy "predictions own update before lock" on public.competition_predictions for update using (profile_id = auth.uid() and locked_at is null) with check (profile_id = auth.uid());
create policy "competition rules admin" on public.competition_score_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "competition rankings public" on public.competition_rankings for select using (true);
create policy "competition ranking items public" on public.competition_ranking_items for select using (true);
create policy "competition rewards public" on public.competition_rewards for select using (is_active = true and deleted_at is null);
create policy "competition achievements public" on public.competition_achievements for select using (is_active = true and deleted_at is null);
create policy "profile achievements own" on public.profile_achievements for select using (profile_id = auth.uid() or public.is_admin());

create policy "wallet own read" on public.barcoin_wallets for select using (profile_id = auth.uid() or public.is_admin());
create policy "transactions own read" on public.barcoin_transactions for select using (profile_id = auth.uid() or public.is_admin());
create policy "barcoin rules public read" on public.barcoin_rules for select using (is_active = true and deleted_at is null);

create policy "products public read" on public.store_products for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "orders own" on public.store_orders for select using (profile_id = auth.uid() or public.is_admin());
create policy "orders own insert" on public.store_orders for insert with check (profile_id = auth.uid());
create policy "order items readable through order" on public.store_order_items for select using (public.is_admin() or exists (select 1 from public.store_orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy "redemptions own" on public.store_redemptions for select using (profile_id = auth.uid() or public.is_admin());

create policy "missions public read" on public.missions for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "profile missions own" on public.profile_missions for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
create policy "ranking boards public" on public.ranking_boards for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "ranking entries public" on public.ranking_entries for select using (true);

create policy "tv channels public" on public.tv_channels for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "tv programs public" on public.tv_programs for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "tv watch own insert" on public.tv_watch_events for insert with check (profile_id is null or profile_id = auth.uid());
create policy "radio stations public" on public.radio_stations for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "radio tracks public" on public.radio_tracks for select using (true);
create policy "radio listen own insert" on public.radio_listen_events for insert with check (profile_id is null or profile_id = auth.uid());

create policy "news categories public" on public.news_categories for select using ((is_active = true and deleted_at is null) or public.is_admin());
create policy "news articles public" on public.news_articles for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "news interactions insert" on public.news_interactions for insert with check (profile_id is null or profile_id = auth.uid());
create policy "events public" on public.events for select using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "event registrations own" on public.event_registrations for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

create policy "system events admins" on public.system_events for select using (public.is_admin());
create policy "feature flags public enabled" on public.feature_flags for select using (enabled = true or public.is_admin());
create policy "app settings public" on public.app_settings for select using (is_public = true or public.is_admin());
create policy "file assets public or owner" on public.file_assets for select using (owner_profile_id = auth.uid() or owner_profile_id is null or public.is_admin());

create policy "admin manage content tables"
on public.store_products for all using (public.is_admin()) with check (public.is_admin());
