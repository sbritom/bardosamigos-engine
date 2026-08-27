-- Bar dos Amigos Engine - premium sports data fields.
-- Incremental and safe: no drops, no table recreation, no data deletion.

alter table public.competitions add column if not exists official_name text;
alter table public.competitions add column if not exists code text;
alter table public.competitions add column if not exists logo_url text;
alter table public.competitions add column if not exists country text;
alter table public.competitions add column if not exists season text;
alter table public.competitions add column if not exists area text;

alter table public.competition_teams add column if not exists crest_url text;
alter table public.competition_teams add column if not exists tla text;
alter table public.competition_teams add column if not exists country text;
alter table public.competition_teams add column if not exists founded integer;
alter table public.competition_teams add column if not exists venue text;
alter table public.competition_teams add column if not exists website text;
alter table public.competition_teams add column if not exists club_colors text;

alter table public.competition_matches add column if not exists home_crest text;
alter table public.competition_matches add column if not exists away_crest text;
alter table public.competition_matches add column if not exists competition_name text;
alter table public.competition_matches add column if not exists competition_code text;
alter table public.competition_matches add column if not exists competition_logo text;
alter table public.competition_matches add column if not exists matchday integer;
alter table public.competition_matches add column if not exists stage text;
alter table public.competition_matches add column if not exists group_name text;
alter table public.competition_matches add column if not exists venue text;
alter table public.competition_matches add column if not exists city text;
alter table public.competition_matches add column if not exists country text;
alter table public.competition_matches add column if not exists home_score integer;
alter table public.competition_matches add column if not exists away_score integer;
alter table public.competition_matches add column if not exists timezone text default 'America/Sao_Paulo';

create index if not exists competitions_code_idx on public.competitions (code);
create index if not exists competition_teams_tla_idx on public.competition_teams (competition_id, tla);
create index if not exists competition_matches_competition_status_idx on public.competition_matches (competition_code, standard_status, starts_at);
