-- Optimize active-module RLS auth lookups and add missing FK indexes.

alter policy "Profiles can read own profile"
  on public.profiles
  using ((select auth.uid()) = id);

alter policy "Profiles can update own profile"
  on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "Users can read own profile_preferences"
  on public.profile_preferences
  using ((select auth.uid()) = profile_id);

alter policy "Users can insert own profile_preferences"
  on public.profile_preferences
  with check ((select auth.uid()) = profile_id);

alter policy "Users can update own profile_preferences"
  on public.profile_preferences
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

alter policy "Users can read own profile_stats"
  on public.profile_stats
  using ((select auth.uid()) = profile_id);

alter policy "Users can insert own profile_stats"
  on public.profile_stats
  with check ((select auth.uid()) = profile_id);

alter policy "Users can update own profile_stats"
  on public.profile_stats
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

alter policy "football_favorites_select_own"
  on public.football_favorites
  using ((select auth.uid()) = profile_id);

alter policy "football_favorites_insert_own"
  on public.football_favorites
  with check ((select auth.uid()) = profile_id);

alter policy "football_favorites_update_own"
  on public.football_favorites
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

alter policy "Users can read own analytics_events"
  on public.analytics_events
  using ((select auth.uid()) = profile_id);

alter policy "Users can insert own analytics_events"
  on public.analytics_events
  with check ((select auth.uid()) = profile_id);

alter policy "Users can update own analytics_events"
  on public.analytics_events
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create index if not exists analytics_events_profile_id_idx
  on public.analytics_events(profile_id);

create index if not exists news_articles_author_profile_id_idx
  on public.news_articles(author_profile_id);

create index if not exists news_articles_category_id_idx
  on public.news_articles(category_id);

create index if not exists competition_seasons_competition_id_idx
  on public.competition_seasons(competition_id);

create index if not exists competition_stages_season_id_idx
  on public.competition_stages(season_id);

create index if not exists competition_rounds_stage_id_idx
  on public.competition_rounds(stage_id);

-- Keep the explicitly named unique active-slug index and drop the duplicate.
drop index if exists public.competitions_slug_active_idx;
