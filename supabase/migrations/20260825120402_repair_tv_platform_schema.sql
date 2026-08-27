-- Repair the TV Platform schema to match the current application contract.
-- Production previously had only the legacy tv_channels shape.

create table if not exists public.tv_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  icon text,
  color text,
  display_order integer not null default 0 check (display_order >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tv_channels add column if not exists category_id uuid;
alter table public.tv_channels add column if not exists name text;
alter table public.tv_channels add column if not exists slug text;
alter table public.tv_channels add column if not exists description text;
alter table public.tv_channels add column if not exists provider text not null default 'iframe';
alter table public.tv_channels add column if not exists embed_url text;
alter table public.tv_channels add column if not exists country text;
alter table public.tv_channels add column if not exists language text;
alter table public.tv_channels add column if not exists featured boolean not null default false;
alter table public.tv_channels add column if not exists verified boolean not null default false;
alter table public.tv_channels add column if not exists enabled boolean not null default true;
alter table public.tv_channels add column if not exists display_order integer not null default 0;
alter table public.tv_channels add column if not exists views bigint not null default 0;
alter table public.tv_channels add column if not exists updated_at timestamptz not null default now();

-- Keep the legacy columns for compatibility, but let the modern TV manager
-- write rows using the canonical columns only.
alter table public.tv_channels alter column nome drop not null;
alter table public.tv_channels alter column categoria drop not null;
alter table public.tv_channels alter column tipo drop not null;

update public.tv_channels
set
  name = coalesce(nullif(name, ''), nullif(nome, '')),
  description = coalesce(description, descricao),
  embed_url = coalesce(embed_url, url),
  enabled = coalesce(enabled, ativo, true),
  display_order = coalesce(display_order, ordem, 0),
  provider = case
    when provider is null or provider = '' then 'embed-canais-tv'
    else provider
  end,
  verified = coalesce(verified, true),
  slug = coalesce(nullif(slug, ''), nullif(canal_id, ''), 'legacy-' || id::text);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tv_channels_category_id_fkey'
      and conrelid = 'public.tv_channels'::regclass
  ) then
    alter table public.tv_channels
      add constraint tv_channels_category_id_fkey
      foreign key (category_id) references public.tv_categories(id)
      on delete set null;
  end if;
end
$$;

create table if not exists public.tv_featured (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.tv_channels(id) on delete cascade,
  priority integer not null default 0 check (priority >= 0),
  start_at timestamptz,
  end_at timestamptz,
  constraint tv_featured_valid_window check (end_at is null or start_at is null or end_at > start_at)
);

create table if not exists public.tv_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.tv_channels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create table if not exists public.tv_recent (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.tv_channels(id) on delete cascade,
  last_watch timestamptz not null default now(),
  watch_time integer not null default 0 check (watch_time >= 0),
  primary key (user_id, channel_id)
);

create unique index if not exists tv_categories_slug_unique_idx
  on public.tv_categories (lower(slug));
create index if not exists tv_categories_public_order_idx
  on public.tv_categories (display_order, name) where enabled = true;
create unique index if not exists tv_channels_slug_unique_idx
  on public.tv_channels (lower(slug)) where slug is not null;
create index if not exists tv_channels_category_order_idx
  on public.tv_channels (category_id, display_order, name) where enabled = true;
create index if not exists tv_channels_featured_idx
  on public.tv_channels (featured, display_order) where enabled = true and featured = true;
create index if not exists tv_featured_schedule_idx
  on public.tv_featured (priority, start_at, end_at);
create index if not exists tv_favorites_user_created_idx
  on public.tv_favorites (user_id, created_at desc);
create index if not exists tv_recent_user_watch_idx
  on public.tv_recent (user_id, last_watch desc);

select public.ensure_updated_at_trigger('public.tv_categories'::regclass);
select public.ensure_updated_at_trigger('public.tv_channels'::regclass);

alter table public.tv_categories enable row level security;
alter table public.tv_channels enable row level security;
alter table public.tv_featured enable row level security;
alter table public.tv_favorites enable row level security;
alter table public.tv_recent enable row level security;

drop policy if exists "Public can read tv_channels" on public.tv_channels;
create policy "Public can read tv_channels"
  on public.tv_channels
  for select
  to anon, authenticated
  using (enabled = true or public.bda_is_admin());

drop policy if exists "Admins can manage tv_channels" on public.tv_channels;
create policy "Admins can manage tv_channels"
  on public.tv_channels
  for all
  to authenticated
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

drop policy if exists "tv categories public read" on public.tv_categories;
create policy "tv categories public read"
  on public.tv_categories
  for select
  to anon, authenticated
  using (enabled = true or public.bda_is_admin());

drop policy if exists "tv categories admin write" on public.tv_categories;
create policy "tv categories admin write"
  on public.tv_categories
  for all
  to authenticated
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

drop policy if exists "tv featured public read" on public.tv_featured;
create policy "tv featured public read"
  on public.tv_featured
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.tv_channels channel
      where channel.id = channel_id
        and channel.enabled = true
    )
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at >= now())
  );

drop policy if exists "tv featured admin write" on public.tv_featured;
create policy "tv featured admin write"
  on public.tv_featured
  for all
  to authenticated
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

drop policy if exists "tv favorites own" on public.tv_favorites;
create policy "tv favorites own"
  on public.tv_favorites
  for all
  to authenticated
  using (((select auth.uid()) = user_id) or public.bda_is_admin())
  with check (((select auth.uid()) = user_id) or public.bda_is_admin());

drop policy if exists "tv recent own" on public.tv_recent;
create policy "tv recent own"
  on public.tv_recent
  for all
  to authenticated
  using (((select auth.uid()) = user_id) or public.bda_is_admin())
  with check (((select auth.uid()) = user_id) or public.bda_is_admin());

grant select on public.tv_categories, public.tv_channels, public.tv_featured to anon, authenticated;
grant insert, update, delete on public.tv_categories, public.tv_channels, public.tv_featured to authenticated;
grant select, insert, update, delete on public.tv_favorites, public.tv_recent to authenticated;
