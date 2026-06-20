-- Bar dos Amigos Engine - Incremental Supabase/PostgreSQL schema
-- Safe for remote databases that already contain legacy Bar dos Amigos tables.
-- This migration must preserve existing data and must not drop or recreate tables.

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  end if;
  if to_jsonb(new) ? 'version' then
    new.version = coalesce(old.version, 0) + 1;
  end if;
  return new;
end;
$$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  entity uuid;
begin
  actor := auth.uid();
  entity := case when tg_op = 'DELETE' then old.id else new.id end;

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
    entity,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.ensure_updated_at_trigger(target_table regclass)
returns void
language plpgsql
as $$
declare
  trigger_name text;
begin
  trigger_name := replace(target_table::text, '.', '_') || '_set_updated_at';

  if not exists (
    select 1
    from pg_trigger
    where tgname = trigger_name
      and tgrelid = target_table
  ) then
    execute format(
      'create trigger %I before update on %s for each row execute function public.set_updated_at()',
      trigger_name,
      target_table
    );
  end if;
end;
$$;

create or replace function public.enable_rls_if_exists(target_table regclass)
returns void
language plpgsql
as $$
begin
  execute format('alter table %s enable row level security', target_table);
exception
  when undefined_table then
    null;
end;
$$;

-- Existing/legacy compatible identity and admin tables.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role public.app_role not null default 'user';
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.profiles add column if not exists version integer not null default 1;

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
      and (
        p.role::text in ('admin', 'super_admin')
        or exists (
          select 1
          from public.admin_assignments aa
          join public.admin_roles ar on ar.id = aa.role_id
          where aa.profile_id = auth.uid()
            and aa.is_active = true
            and ar.is_active = true
            and ar.slug in ('admin', 'super_admin')
        )
      )
  );
$$;

-- New: BarAI.

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

-- New: Bar Competition Engine.

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

-- New: BarCoins, store, missions, rankings, analytics and extensions.

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

create table if not exists public.store_orders (
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

create table if not exists public.store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete restrict,
  quantity integer not null default 1,
  unit_price_barcoins bigint not null default 0,
  unit_price_money numeric(12,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.store_redemptions (
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

create table if not exists public.missions (
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

create table if not exists public.profile_missions (
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

create table if not exists public.ranking_boards (
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

create table if not exists public.ranking_entries (
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

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  source_module text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.extensions (
  id uuid primary key default gen_random_uuid(),
  extension_key text not null unique,
  name text not null,
  version text not null default '0.0.0',
  status text not null default 'installed',
  manifest jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  installed_at timestamptz not null default now(),
  enabled_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version_number integer not null default 1
);

create table if not exists public.extension_permissions (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null references public.extensions(id) on delete cascade,
  permission_key text not null,
  granted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (extension_id, permission_key)
);

create table if not exists public.extension_events (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid references public.extensions(id) on delete set null,
  event_name text not null,
  direction text not null default 'emit',
  payload_schema jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Legacy content compatibility. These use IF NOT EXISTS and safe ADD COLUMN only.

create table if not exists public.tv_channels (
  id uuid primary key default gen_random_uuid()
);
alter table public.tv_channels add column if not exists name text;
alter table public.tv_channels add column if not exists slug text;
alter table public.tv_channels add column if not exists description text;
alter table public.tv_channels add column if not exists stream_url text;
alter table public.tv_channels add column if not exists thumbnail_url text;
alter table public.tv_channels add column if not exists status public.content_status default 'draft';
alter table public.tv_channels add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.tv_channels add column if not exists created_at timestamptz not null default now();
alter table public.tv_channels add column if not exists updated_at timestamptz not null default now();
alter table public.tv_channels add column if not exists deleted_at timestamptz;
alter table public.tv_channels add column if not exists version integer not null default 1;

create table if not exists public.radio_stations (
  id uuid primary key default gen_random_uuid()
);
alter table public.radio_stations add column if not exists name text;
alter table public.radio_stations add column if not exists slug text;
alter table public.radio_stations add column if not exists stream_url text;
alter table public.radio_stations add column if not exists cover_url text;
alter table public.radio_stations add column if not exists status public.content_status default 'draft';
alter table public.radio_stations add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.radio_stations add column if not exists created_at timestamptz not null default now();
alter table public.radio_stations add column if not exists updated_at timestamptz not null default now();
alter table public.radio_stations add column if not exists deleted_at timestamptz;
alter table public.radio_stations add column if not exists version integer not null default 1;

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

-- Safe indexes. Existing indexes are preserved.

create unique index if not exists profiles_username_active_idx on public.profiles (lower(username)) where username is not null and deleted_at is null;
create unique index if not exists competitions_slug_active_idx on public.competitions (slug) where deleted_at is null;
create unique index if not exists competition_predictions_unique_active_idx on public.competition_predictions (match_id, profile_id) where deleted_at is null;
create unique index if not exists store_products_slug_active_idx on public.store_products (slug) where deleted_at is null;
create unique index if not exists missions_slug_active_idx on public.missions (slug) where deleted_at is null;
create unique index if not exists ranking_boards_slug_active_idx on public.ranking_boards (slug) where deleted_at is null;
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_table, entity_id);
create index if not exists barai_messages_session_idx on public.barai_messages (session_id, created_at);
create index if not exists barai_memory_scope_idx on public.barai_memory (profile_id, scope, key);
create index if not exists competition_matches_round_status_idx on public.competition_matches (round_id, status, starts_at);
create index if not exists competition_teams_competition_idx on public.competition_teams (competition_id, name);
create index if not exists competition_rank_items_position_idx on public.competition_ranking_items (ranking_id, position);
create index if not exists barcoin_transactions_profile_idx on public.barcoin_transactions (profile_id, created_at desc);
create index if not exists store_orders_profile_idx on public.store_orders (profile_id, created_at desc);
create index if not exists profile_missions_status_idx on public.profile_missions (profile_id, status);
create index if not exists ranking_entries_board_position_idx on public.ranking_entries (ranking_board_id, position);
create index if not exists analytics_events_module_idx on public.analytics_events (source_module, occurred_at desc);
create index if not exists extensions_key_idx on public.extensions (extension_key);
create index if not exists tv_channels_slug_idx on public.tv_channels (slug);
create index if not exists radio_stations_slug_idx on public.radio_stations (slug);
create index if not exists news_articles_status_idx on public.news_articles (status, published_at desc);

-- Views use CREATE OR REPLACE and do not modify underlying data.

create or replace view public.public_competitions as
select id, name, slug, type, description, status, starts_at, ends_at, metadata
from public.competitions
where status = 'published' and deleted_at is null;

create or replace view public.public_news_articles as
select id, category_id, title, slug, summary, cover_url, published_at, metadata
from public.news_articles
where status = 'published' and deleted_at is null;

create or replace view public.public_events as
select id, title, slug, description, location, starts_at, ends_at, capacity, metadata
from public.events
where status = 'published' and deleted_at is null;

-- Auth bootstrap trigger, created only when missing.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
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

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end;
$$;

-- Triggers are attached only when missing.

select public.ensure_updated_at_trigger('public.profiles'::regclass);
select public.ensure_updated_at_trigger('public.profile_stats'::regclass);
select public.ensure_updated_at_trigger('public.profile_preferences'::regclass);
select public.ensure_updated_at_trigger('public.admin_roles'::regclass);
select public.ensure_updated_at_trigger('public.admin_assignments'::regclass);
select public.ensure_updated_at_trigger('public.barai_sessions'::regclass);
select public.ensure_updated_at_trigger('public.barai_messages'::regclass);
select public.ensure_updated_at_trigger('public.barai_memory'::regclass);
select public.ensure_updated_at_trigger('public.competitions'::regclass);
select public.ensure_updated_at_trigger('public.competition_seasons'::regclass);
select public.ensure_updated_at_trigger('public.competition_stages'::regclass);
select public.ensure_updated_at_trigger('public.competition_rounds'::regclass);
select public.ensure_updated_at_trigger('public.competition_teams'::regclass);
select public.ensure_updated_at_trigger('public.competition_matches'::regclass);
select public.ensure_updated_at_trigger('public.competition_predictions'::regclass);
select public.ensure_updated_at_trigger('public.barcoin_wallets'::regclass);
select public.ensure_updated_at_trigger('public.barcoin_transactions'::regclass);
select public.ensure_updated_at_trigger('public.store_products'::regclass);
select public.ensure_updated_at_trigger('public.store_orders'::regclass);
select public.ensure_updated_at_trigger('public.missions'::regclass);
select public.ensure_updated_at_trigger('public.profile_missions'::regclass);
select public.ensure_updated_at_trigger('public.ranking_boards'::regclass);
select public.ensure_updated_at_trigger('public.ranking_entries'::regclass);
select public.ensure_updated_at_trigger('public.extensions'::regclass);
select public.ensure_updated_at_trigger('public.extension_permissions'::regclass);
select public.ensure_updated_at_trigger('public.tv_channels'::regclass);
select public.ensure_updated_at_trigger('public.radio_stations'::regclass);
select public.ensure_updated_at_trigger('public.news_articles'::regclass);
select public.ensure_updated_at_trigger('public.events'::regclass);

-- RLS and policies. Policies are created conditionally to avoid duplicate policy errors.

select public.enable_rls_if_exists('public.profiles'::regclass);
select public.enable_rls_if_exists('public.profile_stats'::regclass);
select public.enable_rls_if_exists('public.profile_preferences'::regclass);
select public.enable_rls_if_exists('public.admin_roles'::regclass);
select public.enable_rls_if_exists('public.admin_assignments'::regclass);
select public.enable_rls_if_exists('public.audit_logs'::regclass);
select public.enable_rls_if_exists('public.barai_sessions'::regclass);
select public.enable_rls_if_exists('public.barai_messages'::regclass);
select public.enable_rls_if_exists('public.barai_memory'::regclass);
select public.enable_rls_if_exists('public.barai_feedback'::regclass);
select public.enable_rls_if_exists('public.competitions'::regclass);
select public.enable_rls_if_exists('public.competition_predictions'::regclass);
select public.enable_rls_if_exists('public.barcoin_wallets'::regclass);
select public.enable_rls_if_exists('public.barcoin_transactions'::regclass);
select public.enable_rls_if_exists('public.store_products'::regclass);
select public.enable_rls_if_exists('public.store_orders'::regclass);
select public.enable_rls_if_exists('public.missions'::regclass);
select public.enable_rls_if_exists('public.profile_missions'::regclass);
select public.enable_rls_if_exists('public.ranking_boards'::regclass);
select public.enable_rls_if_exists('public.ranking_entries'::regclass);
select public.enable_rls_if_exists('public.analytics_events'::regclass);
select public.enable_rls_if_exists('public.extensions'::regclass);
select public.enable_rls_if_exists('public.extension_permissions'::regclass);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles read own or admin') then
    create policy "profiles read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles update own or admin') then
    create policy "profiles update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'barai_sessions' and policyname = 'barai sessions own') then
    create policy "barai sessions own" on public.barai_sessions for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'barai_messages' and policyname = 'barai messages own') then
    create policy "barai messages own" on public.barai_messages for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'barai_memory' and policyname = 'barai memory own') then
    create policy "barai memory own" on public.barai_memory for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'competitions' and policyname = 'published competitions readable') then
    create policy "published competitions readable" on public.competitions for select using ((status = 'published' and deleted_at is null) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'competition_predictions' and policyname = 'predictions own read') then
    create policy "predictions own read" on public.competition_predictions for select using (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'competition_predictions' and policyname = 'predictions own insert') then
    create policy "predictions own insert" on public.competition_predictions for insert with check (profile_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'barcoin_wallets' and policyname = 'wallet own read') then
    create policy "wallet own read" on public.barcoin_wallets for select using (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'barcoin_transactions' and policyname = 'transactions own read') then
    create policy "transactions own read" on public.barcoin_transactions for select using (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'store_products' and policyname = 'products public read') then
    create policy "products public read" on public.store_products for select using ((status = 'published' and deleted_at is null) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'store_orders' and policyname = 'orders own read') then
    create policy "orders own read" on public.store_orders for select using (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'missions' and policyname = 'missions public read') then
    create policy "missions public read" on public.missions for select using ((status = 'published' and deleted_at is null) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profile_missions' and policyname = 'profile missions own') then
    create policy "profile missions own" on public.profile_missions for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ranking_boards' and policyname = 'ranking boards public') then
    create policy "ranking boards public" on public.ranking_boards for select using ((status = 'published' and deleted_at is null) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ranking_entries' and policyname = 'ranking entries public') then
    create policy "ranking entries public" on public.ranking_entries for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'analytics insert authenticated') then
    create policy "analytics insert authenticated" on public.analytics_events for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'extensions' and policyname = 'extensions admin read') then
    create policy "extensions admin read" on public.extensions for select using (public.is_admin());
  end if;
end;
$$;
