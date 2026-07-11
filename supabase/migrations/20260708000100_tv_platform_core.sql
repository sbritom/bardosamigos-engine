-- TV Platform Core v1.0
-- Additive migration for databases that already contain public.tv_channels.

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
alter table public.tv_channels add column if not exists logo text;
alter table public.tv_channels add column if not exists provider text not null default 'iframe';
alter table public.tv_channels add column if not exists embed_url text;
alter table public.tv_channels add column if not exists country text;
alter table public.tv_channels add column if not exists language text;
alter table public.tv_channels add column if not exists featured boolean not null default false;
alter table public.tv_channels add column if not exists verified boolean not null default false;
alter table public.tv_channels add column if not exists enabled boolean not null default true;
alter table public.tv_channels add column if not exists display_order integer not null default 0;
alter table public.tv_channels add column if not exists views bigint not null default 0;
alter table public.tv_channels add column if not exists created_at timestamptz not null default now();
alter table public.tv_channels add column if not exists updated_at timestamptz not null default now();

-- Preserve legacy URLs while exposing the provider-neutral column.
update public.tv_channels
set embed_url = stream_url
where embed_url is null
  and stream_url is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tv_channels_category_id_fkey'
      and conrelid = 'public.tv_channels'::regclass
  ) then
    alter table public.tv_channels
      add constraint tv_channels_category_id_fkey
      foreign key (category_id) references public.tv_categories(id) on delete set null
      not valid;
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
create index if not exists tv_channels_slug_lookup_idx
  on public.tv_channels (lower(slug)) where slug is not null;
create index if not exists tv_channels_category_order_idx
  on public.tv_channels (category_id, display_order, name) where enabled = true;
create index if not exists tv_channels_featured_idx
  on public.tv_channels (featured, display_order) where enabled = true and featured = true;
create index if not exists tv_channels_search_idx
  on public.tv_channels using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));
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

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_categories' and policyname = 'tv categories public read') then
    create policy "tv categories public read" on public.tv_categories for select using (enabled = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_categories' and policyname = 'tv categories admin write') then
    create policy "tv categories admin write" on public.tv_categories for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_channels' and policyname = 'tv channels public read') then
    create policy "tv channels public read" on public.tv_channels for select using (enabled = true or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_channels' and policyname = 'tv channels admin write') then
    create policy "tv channels admin write" on public.tv_channels for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_featured' and policyname = 'tv featured public read') then
    create policy "tv featured public read" on public.tv_featured for select using (
      exists (
        select 1 from public.tv_channels channel
        where channel.id = channel_id and channel.enabled = true
      )
      and (start_at is null or start_at <= now())
      and (end_at is null or end_at >= now())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_featured' and policyname = 'tv featured admin write') then
    create policy "tv featured admin write" on public.tv_featured for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_favorites' and policyname = 'tv favorites own') then
    create policy "tv favorites own" on public.tv_favorites for all
      using (user_id = auth.uid() or public.is_admin())
      with check (user_id = auth.uid() or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tv_recent' and policyname = 'tv recent own') then
    create policy "tv recent own" on public.tv_recent for all
      using (user_id = auth.uid() or public.is_admin())
      with check (user_id = auth.uid() or public.is_admin());
  end if;
end
$$;
