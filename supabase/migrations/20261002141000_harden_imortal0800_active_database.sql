-- IMORTAL0800 active database hardening.
-- Keeps current behavior while reducing public RPC exposure, RLS overhead and missing FK indexes.

-- Internal auth trigger function must not be callable through the Data API.
revoke execute on function public.handle_new_auth_user_profile() from public, anon, authenticated;

-- The public ranking RPC is being moved behind a server-side API. Grant the server role
-- explicitly now; anon/authenticated revocation is intentionally deferred until that
-- frontend/API version is published, avoiding a production ranking outage.
grant execute on function public.imortal_get_latest_prediction_ranking(text) to service_role;

-- Active portal foreign-key indexes.
create index if not exists competition_predictions_profile_id_idx on public.competition_predictions (profile_id);
create index if not exists competition_ranking_items_profile_id_idx on public.competition_ranking_items (profile_id);
create index if not exists competition_ranking_items_ranking_id_idx on public.competition_ranking_items (ranking_id);
create index if not exists competition_rankings_competition_id_idx on public.competition_rankings (competition_id);
create index if not exists competition_rankings_season_id_idx on public.competition_rankings (season_id);
create index if not exists competition_rewards_competition_id_idx on public.competition_rewards (competition_id);
create index if not exists competition_score_rules_competition_id_idx on public.competition_score_rules (competition_id);
create index if not exists radio_evox_ranking_updated_by_idx on public.radio_evox_ranking (updated_by);
create index if not exists radio_programs_updated_by_idx on public.radio_programs (updated_by);
create index if not exists radio_schedule_updated_by_idx on public.radio_schedule (updated_by);
create index if not exists competition_achievements_competition_id_idx on public.competition_achievements (competition_id);
create index if not exists competition_achievements_reward_id_idx on public.competition_achievements (reward_id);
create index if not exists profile_achievements_achievement_id_idx on public.profile_achievements (achievement_id);
create index if not exists profile_missions_mission_id_idx on public.profile_missions (mission_id);

-- Radio staff authorization: evaluate the JWT once per statement.
alter policy "radio_evox_ranking_staff_update"
  on public.radio_evox_ranking
  using (
    id = 'imortal0800'
    and (
      coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = any (array['admin','locutor'])
      or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin'), '') = 'true'
    )
  )
  with check (
    id = 'imortal0800'
    and (
      coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = any (array['admin','locutor'])
      or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin'), '') = 'true'
    )
  );

-- competition_predictions: consolidate admin + owner policies into one policy per action.
drop policy if exists "Admins can manage competition_predictions" on public.competition_predictions;
drop policy if exists "Users can insert own competition_predictions" on public.competition_predictions;
drop policy if exists "Users can read own competition_predictions" on public.competition_predictions;
drop policy if exists "Users can update own competition_predictions" on public.competition_predictions;
drop policy if exists "competition_predictions_select" on public.competition_predictions;
drop policy if exists "competition_predictions_insert" on public.competition_predictions;
drop policy if exists "competition_predictions_update" on public.competition_predictions;
drop policy if exists "competition_predictions_delete" on public.competition_predictions;
create policy "competition_predictions_select" on public.competition_predictions
  for select to authenticated using ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "competition_predictions_insert" on public.competition_predictions
  for insert to authenticated with check ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "competition_predictions_update" on public.competition_predictions
  for update to authenticated
  using ((select public.bda_is_admin()) or (select auth.uid()) = profile_id)
  with check ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "competition_predictions_delete" on public.competition_predictions
  for delete to authenticated using ((select public.bda_is_admin()));

-- Per-profile achievements.
drop policy if exists "Admins can manage profile_achievements" on public.profile_achievements;
drop policy if exists "Users can insert own profile_achievements" on public.profile_achievements;
drop policy if exists "Users can read own profile_achievements" on public.profile_achievements;
drop policy if exists "Users can update own profile_achievements" on public.profile_achievements;
drop policy if exists "profile_achievements_select" on public.profile_achievements;
drop policy if exists "profile_achievements_insert" on public.profile_achievements;
drop policy if exists "profile_achievements_update" on public.profile_achievements;
drop policy if exists "profile_achievements_delete" on public.profile_achievements;
create policy "profile_achievements_select" on public.profile_achievements
  for select to authenticated using ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "profile_achievements_insert" on public.profile_achievements
  for insert to authenticated with check ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "profile_achievements_update" on public.profile_achievements
  for update to authenticated
  using ((select public.bda_is_admin()) or (select auth.uid()) = profile_id)
  with check ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "profile_achievements_delete" on public.profile_achievements
  for delete to authenticated using ((select public.bda_is_admin()));

-- Per-profile missions.
drop policy if exists "Admins can manage profile_missions" on public.profile_missions;
drop policy if exists "Users can insert own profile_missions" on public.profile_missions;
drop policy if exists "Users can read own profile_missions" on public.profile_missions;
drop policy if exists "Users can update own profile_missions" on public.profile_missions;
drop policy if exists "profile_missions_select" on public.profile_missions;
drop policy if exists "profile_missions_insert" on public.profile_missions;
drop policy if exists "profile_missions_update" on public.profile_missions;
drop policy if exists "profile_missions_delete" on public.profile_missions;
create policy "profile_missions_select" on public.profile_missions
  for select to authenticated using ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "profile_missions_insert" on public.profile_missions
  for insert to authenticated with check ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "profile_missions_update" on public.profile_missions
  for update to authenticated
  using ((select public.bda_is_admin()) or (select auth.uid()) = profile_id)
  with check ((select public.bda_is_admin()) or (select auth.uid()) = profile_id);
create policy "profile_missions_delete" on public.profile_missions
  for delete to authenticated using ((select public.bda_is_admin()));

-- Profiles: merge the duplicate INSERT paths while preserving owner/admin behavior.
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "Profiles can insert own or admin" on public.profiles;
create policy "Profiles can insert own or admin" on public.profiles
  for insert to authenticated
  with check ((select public.bda_is_admin()) or (select auth.uid()) = id);

-- Helper block for tables where authenticated admins write and everyone may read.
do $policy$
declare
  target text;
  admin_all_name text;
begin
  foreach target in array array[
    'competition_achievements',
    'competition_ranking_items',
    'competition_rankings',
    'competition_rewards',
    'competition_score_rules',
    'missions',
    'radio_stations'
  ] loop
    admin_all_name := 'Admins can manage ' || target;
    execute format('drop policy if exists %I on public.%I', admin_all_name, target);
    execute format('drop policy if exists %I on public.%I', 'Admins can insert ' || target, target);
    execute format('drop policy if exists %I on public.%I', 'Admins can update ' || target, target);
    execute format('drop policy if exists %I on public.%I', 'Admins can delete ' || target, target);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select public.bda_is_admin()))',
      'Admins can insert ' || target,
      target
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select public.bda_is_admin())) with check ((select public.bda_is_admin()))',
      'Admins can update ' || target,
      target
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select public.bda_is_admin()))',
      'Admins can delete ' || target,
      target
    );
  end loop;
end
$policy$;
