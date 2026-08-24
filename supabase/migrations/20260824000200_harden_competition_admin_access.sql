-- Bar dos Amigos - Competition admin hardening.
-- Additive and idempotent: aligns the trusted admin claim with database RLS,
-- enables RLS on Competition catalog tables and closes direct write access.

-- app_metadata is controlled by the authentication backend (unlike
-- user_metadata), so it is safe to use as an additional trusted admin source.
-- Existing profile roles/admin assignments remain valid for compatibility.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false')) = 'true'
    or exists (
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

  -- Auxiliary football catalog tables remain public read models for all
  -- non-deleted records, while writes require an administrator.
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
