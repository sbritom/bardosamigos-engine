-- Bar dos Amigos Engine - Brazil time fields for synchronized matches.
-- Incremental and safe: no drops, no table recreation, no data deletion.

alter table public.competition_matches add column if not exists utc_date timestamptz;
alter table public.competition_matches add column if not exists local_date date;
alter table public.competition_matches add column if not exists local_date_iso text;
alter table public.competition_matches add column if not exists local_time text;
alter table public.competition_matches add column if not exists standard_status text;

create index if not exists competition_matches_local_date_status_idx
  on public.competition_matches (local_date, standard_status, starts_at);
