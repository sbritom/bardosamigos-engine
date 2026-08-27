-- Bar dos Amigos Engine - Football data deduplication.
-- Safe cleanup: soft delete duplicate synchronized rows and add partial unique indexes.

with ranked_matches as (
  select
    id,
    row_number() over (
      partition by external_ref
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.competition_matches
  where external_ref is not null
    and deleted_at is null
)
update public.competition_matches matches
set
  deleted_at = now(),
  updated_at = now(),
  metadata = coalesce(matches.metadata, '{}'::jsonb) || jsonb_build_object('deduplicatedBy', '20260623000200_deduplicate_football_data')
from ranked_matches
where matches.id = ranked_matches.id
  and ranked_matches.rn > 1;

with ranked_teams as (
  select
    id,
    row_number() over (
      partition by competition_id, lower(name)
      order by
        case when crest_url is not null and crest_url <> '' then 0 else 1 end,
        updated_at desc nulls last,
        created_at desc nulls last,
        id desc
    ) as rn
  from public.competition_teams
  where deleted_at is null
)
update public.competition_teams teams
set
  deleted_at = now(),
  updated_at = now(),
  metadata = coalesce(teams.metadata, '{}'::jsonb) || jsonb_build_object('deduplicatedBy', '20260623000200_deduplicate_football_data')
from ranked_teams
where teams.id = ranked_teams.id
  and ranked_teams.rn > 1;

with ranked_competitions as (
  select
    id,
    row_number() over (
      partition by slug
      order by
        case when logo_url is not null and logo_url <> '' then 0 else 1 end,
        updated_at desc nulls last,
        created_at desc nulls last,
        id desc
    ) as rn
  from public.competitions
  where deleted_at is null
)
update public.competitions competitions
set
  deleted_at = now(),
  updated_at = now(),
  metadata = coalesce(competitions.metadata, '{}'::jsonb) || jsonb_build_object('deduplicatedBy', '20260623000200_deduplicate_football_data')
from ranked_competitions
where competitions.id = ranked_competitions.id
  and ranked_competitions.rn > 1;

create unique index if not exists competition_matches_external_ref_unique_active_idx
  on public.competition_matches (external_ref)
  where external_ref is not null and deleted_at is null;

create unique index if not exists competition_teams_competition_name_unique_active_idx
  on public.competition_teams (competition_id, lower(name))
  where deleted_at is null;

create unique index if not exists competitions_slug_unique_active_idx
  on public.competitions (slug)
  where deleted_at is null;
