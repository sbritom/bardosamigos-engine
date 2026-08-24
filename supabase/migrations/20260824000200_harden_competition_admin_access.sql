-- Bar dos Amigos - Competition admin hardening.
-- Additive and idempotent: enables RLS and closes direct write access
-- while preserving the public read paths used by the football portal.

alter table if exists public.competitions enable row level security;
alter table if exists public.competition_seasons enable row level security;
alter table if exists public.competition_stages enable row level security;
alter table if exists public.competition_rounds enable row level security;
alter table if exists public.competition_teams enable row level security;
alter table if exists public.competition_matches enable row level security;

do $$
begin
  -- Competitions already have the canonical published-only public read policy.
  if to_regclass('public.competitions') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competitions'
        and policyname = 'competitions admin write'
    ) then
    create policy "competitions admin write"
      on public.competitions
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  -- Auxiliary football catalog tables are public read models. RLS prevents
  -- anonymous/authenticated clients from mutating them directly.
  if to_regclass('public.competition_seasons') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_seasons'
        and policyname = 'competition seasons public read'
    ) then
    create policy "competition seasons public read"
      on public.competition_seasons
      for select
      using (deleted_at is null or public.is_admin());
  end if;

  if to_regclass('public.competition_seasons') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_seasons'
        and policyname = 'competition seasons admin write'
    ) then
    create policy "competition seasons admin write"
      on public.competition_seasons
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if to_regclass('public.competition_stages') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_stages'
        and policyname = 'competition stages public read'
    ) then
    create policy "competition stages public read"
      on public.competition_stages
      for select
      using (deleted_at is null or public.is_admin());
  end if;

  if to_regclass('public.competition_stages') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_stages'
        and policyname = 'competition stages admin write'
    ) then
    create policy "competition stages admin write"
      on public.competition_stages
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if to_regclass('public.competition_rounds') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_rounds'
        and policyname = 'competition rounds public read'
    ) then
    create policy "competition rounds public read"
      on public.competition_rounds
      for select
      using (deleted_at is null or public.is_admin());
  end if;

  if to_regclass('public.competition_rounds') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_rounds'
        and policyname = 'competition rounds admin write'
    ) then
    create policy "competition rounds admin write"
      on public.competition_rounds
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if to_regclass('public.competition_teams') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_teams'
        and policyname = 'competition teams public read'
    ) then
    create policy "competition teams public read"
      on public.competition_teams
      for select
      using (deleted_at is null or public.is_admin());
  end if;

  if to_regclass('public.competition_teams') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_teams'
        and policyname = 'competition teams admin write'
    ) then
    create policy "competition teams admin write"
      on public.competition_teams
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  -- Keep the existing public match read policy and add complete admin writes.
  if to_regclass('public.competition_matches') is not null
    and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'competition_matches'
        and policyname = 'matches admin write'
    ) then
    create policy "matches admin write"
      on public.competition_matches
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end
$$;
