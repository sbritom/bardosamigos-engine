-- Consolidate permissive RLS policies for active portal modules without changing effective access.

-- Personal/profile tables: combine owner and admin access in one policy per action.
alter policy "Profiles can read own profile"
  on public.profiles
  using (((select auth.uid()) = id) or (select public.bda_is_admin()));

alter policy "Profiles can update own profile"
  on public.profiles
  using (((select auth.uid()) = id) or (select public.bda_is_admin()))
  with check (((select auth.uid()) = id) or (select public.bda_is_admin()));

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can insert profiles"
  on public.profiles for insert to authenticated
  with check ((select public.bda_is_admin()));
create policy "Admins can delete profiles"
  on public.profiles for delete to authenticated
  using ((select public.bda_is_admin()));

alter policy "Users can read own profile_preferences"
  on public.profile_preferences
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "Users can insert own profile_preferences"
  on public.profile_preferences
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "Users can update own profile_preferences"
  on public.profile_preferences
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()))
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
drop policy if exists "Admins can manage profile_preferences" on public.profile_preferences;
create policy "Admins can delete profile_preferences"
  on public.profile_preferences for delete to authenticated
  using ((select public.bda_is_admin()));

alter policy "Users can read own profile_stats"
  on public.profile_stats
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "Users can insert own profile_stats"
  on public.profile_stats
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "Users can update own profile_stats"
  on public.profile_stats
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()))
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
drop policy if exists "Admins can manage profile_stats" on public.profile_stats;
create policy "Admins can delete profile_stats"
  on public.profile_stats for delete to authenticated
  using ((select public.bda_is_admin()));

alter policy "football_favorites_select_own"
  on public.football_favorites
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "football_favorites_insert_own"
  on public.football_favorites
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "football_favorites_update_own"
  on public.football_favorites
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()))
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
drop policy if exists "Admins can manage football_favorites" on public.football_favorites;
create policy "Admins can delete football_favorites"
  on public.football_favorites for delete to authenticated
  using ((select public.bda_is_admin()));

alter policy "Users can read own analytics_events"
  on public.analytics_events
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "Users can insert own analytics_events"
  on public.analytics_events
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
alter policy "Users can update own analytics_events"
  on public.analytics_events
  using (((select auth.uid()) = profile_id) or (select public.bda_is_admin()))
  with check (((select auth.uid()) = profile_id) or (select public.bda_is_admin()));
drop policy if exists "Admins can manage analytics_events" on public.analytics_events;
create policy "Admins can delete analytics_events"
  on public.analytics_events for delete to authenticated
  using ((select public.bda_is_admin()));

-- Public content tables: public SELECT remains separate; admin policies cover writes only.
drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can insert events" on public.events for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update events" on public.events for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete events" on public.events for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage news_articles" on public.news_articles;
create policy "Admins can insert news_articles" on public.news_articles for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update news_articles" on public.news_articles for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete news_articles" on public.news_articles for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage news_categories" on public.news_categories;
create policy "Admins can insert news_categories" on public.news_categories for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update news_categories" on public.news_categories for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete news_categories" on public.news_categories for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage tv_channels" on public.tv_channels;
create policy "Admins can insert tv_channels" on public.tv_channels for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update tv_channels" on public.tv_channels for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete tv_channels" on public.tv_channels for delete to authenticated using ((select public.bda_is_admin()));

-- Competition catalog: public SELECT policies remain unchanged; split admin ALL into write-only policies.
drop policy if exists "Admins can manage competitions" on public.competitions;
create policy "Admins can insert competitions" on public.competitions for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update competitions" on public.competitions for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete competitions" on public.competitions for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage competition_seasons" on public.competition_seasons;
create policy "Admins can insert competition_seasons" on public.competition_seasons for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update competition_seasons" on public.competition_seasons for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete competition_seasons" on public.competition_seasons for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage competition_stages" on public.competition_stages;
create policy "Admins can insert competition_stages" on public.competition_stages for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update competition_stages" on public.competition_stages for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete competition_stages" on public.competition_stages for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage competition_rounds" on public.competition_rounds;
create policy "Admins can insert competition_rounds" on public.competition_rounds for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update competition_rounds" on public.competition_rounds for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete competition_rounds" on public.competition_rounds for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage competition_teams" on public.competition_teams;
create policy "Admins can insert competition_teams" on public.competition_teams for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update competition_teams" on public.competition_teams for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete competition_teams" on public.competition_teams for delete to authenticated using ((select public.bda_is_admin()));

drop policy if exists "Admins can manage competition_matches" on public.competition_matches;
create policy "Admins can insert competition_matches" on public.competition_matches for insert to authenticated with check ((select public.bda_is_admin()));
create policy "Admins can update competition_matches" on public.competition_matches for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()));
create policy "Admins can delete competition_matches" on public.competition_matches for delete to authenticated using ((select public.bda_is_admin()));
