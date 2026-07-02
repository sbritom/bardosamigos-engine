-- Bar dos Amigos Engine - Football favorites.
-- Incremental and safe: no drops, no table recreation, no data deletion.

create table if not exists public.football_favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  favorite_type text not null,
  favorite_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint football_favorites_type_check check (favorite_type in ('team', 'competition'))
);

create unique index if not exists football_favorites_unique_active_idx
  on public.football_favorites (profile_id, favorite_type, favorite_id)
  where deleted_at is null;

create index if not exists football_favorites_profile_idx
  on public.football_favorites (profile_id, favorite_type)
  where deleted_at is null;

alter table public.football_favorites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'football_favorites'
      and policyname = 'football_favorites_select_own'
  ) then
    create policy football_favorites_select_own
      on public.football_favorites
      for select
      using (auth.uid() = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'football_favorites'
      and policyname = 'football_favorites_insert_own'
  ) then
    create policy football_favorites_insert_own
      on public.football_favorites
      for insert
      with check (auth.uid() = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'football_favorites'
      and policyname = 'football_favorites_update_own'
  ) then
    create policy football_favorites_update_own
      on public.football_favorites
      for update
      using (auth.uid() = profile_id)
      with check (auth.uid() = profile_id);
  end if;
end $$;
