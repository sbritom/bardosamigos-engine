-- Bar dos Amigos - align Competition RLS with the verified production model.
-- This migration is intentionally idempotent and reconciles policy names from
-- older migrations with the canonical policies already validated in production.

create or replace function public.bda_is_admin()
returns boolean
language sql
stable
set search_path to ''
as $function$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false')) = 'true';
$function$;

alter table public.competitions enable row level security;
alter table public.competition_seasons enable row level security;
alter table public.competition_stages enable row level security;
alter table public.competition_rounds enable row level security;
alter table public.competition_teams enable row level security;
alter table public.competition_matches enable row level security;

-- Avoid accidentally hiding an existing active catalog that has never been
-- published. Empty environments are unaffected.
do $$
begin
  if exists (
    select 1
    from public.competitions
    where deleted_at is null
  )
  and not exists (
    select 1
    from public.competitions
    where deleted_at is null
      and status = 'published'
  ) then
    raise exception
      'ABORTADO: existem competicoes ativas, mas nenhuma esta com status published.';
  end if;
end
$$;

-- competitions
drop policy if exists "competitions admin write" on public.competitions;
drop policy if exists "published competitions readable" on public.competitions;
drop policy if exists "Admins can manage competitions" on public.competitions;
drop policy if exists "Public can read competitions" on public.competitions;

create policy "Admins can manage competitions"
  on public.competitions
  for all
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "Public can read competitions"
  on public.competitions
  for select
  using (
    (status = 'published' and deleted_at is null)
    or public.bda_is_admin()
  );

-- seasons
drop policy if exists "competition seasons public read" on public.competition_seasons;
drop policy if exists "competition seasons admin write" on public.competition_seasons;
drop policy if exists "Admins can manage competition_seasons" on public.competition_seasons;
drop policy if exists "Public can read competition_seasons" on public.competition_seasons;

create policy "Admins can manage competition_seasons"
  on public.competition_seasons
  for all
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "Public can read competition_seasons"
  on public.competition_seasons
  for select
  using (deleted_at is null or public.bda_is_admin());

-- stages
drop policy if exists "competition stages public read" on public.competition_stages;
drop policy if exists "competition stages admin write" on public.competition_stages;
drop policy if exists "Admins can manage competition_stages" on public.competition_stages;
drop policy if exists "Public can read competition_stages" on public.competition_stages;

create policy "Admins can manage competition_stages"
  on public.competition_stages
  for all
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "Public can read competition_stages"
  on public.competition_stages
  for select
  using (deleted_at is null or public.bda_is_admin());

-- rounds
drop policy if exists "competition rounds public read" on public.competition_rounds;
drop policy if exists "competition rounds admin write" on public.competition_rounds;
drop policy if exists "Admins can manage competition_rounds" on public.competition_rounds;
drop policy if exists "Public can read competition_rounds" on public.competition_rounds;

create policy "Admins can manage competition_rounds"
  on public.competition_rounds
  for all
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "Public can read competition_rounds"
  on public.competition_rounds
  for select
  using (deleted_at is null or public.bda_is_admin());

-- teams
drop policy if exists "competition teams public read" on public.competition_teams;
drop policy if exists "competition teams admin write" on public.competition_teams;
drop policy if exists "Admins can manage competition_teams" on public.competition_teams;
drop policy if exists "Public can read competition_teams" on public.competition_teams;

create policy "Admins can manage competition_teams"
  on public.competition_teams
  for all
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "Public can read competition_teams"
  on public.competition_teams
  for select
  using (deleted_at is null or public.bda_is_admin());

-- matches
drop policy if exists "matches public read" on public.competition_matches;
drop policy if exists "matches admin write" on public.competition_matches;
drop policy if exists "matches admin result update" on public.competition_matches;
drop policy if exists "Admins can manage competition_matches" on public.competition_matches;
drop policy if exists "Public can read competition_matches" on public.competition_matches;

create policy "Admins can manage competition_matches"
  on public.competition_matches
  for all
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "Public can read competition_matches"
  on public.competition_matches
  for select
  using (deleted_at is null or public.bda_is_admin());
