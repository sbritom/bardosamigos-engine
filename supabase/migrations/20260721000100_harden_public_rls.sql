-- Security hardening for public schema exposed through PostgREST.
-- Enables RLS everywhere, keeps public content readable, and restricts
-- administrative/private writes to authenticated admins through app_metadata.

create or replace function public.bda_is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$;

create or replace function public.bda_is_radio_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'locutor'), false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  end if;
  if to_jsonb(new) ? 'version' then
    new.version = coalesce(old.version, 0) + 1;
  end if;
  return new;
end;
$function$;

create or replace function public.ensure_updated_at_trigger(target_table regclass)
returns void
language plpgsql
set search_path = ''
as $function$
declare
  trigger_name text;
begin
  trigger_name := replace(target_table::text, '.', '_') || '_set_updated_at';

  if not exists (
    select 1
    from pg_trigger
    where tgname = trigger_name
      and tgrelid = target_table
  ) then
    execute format(
      'create trigger %I before update on %s for each row execute function public.set_updated_at()',
      trigger_name,
      target_table
    );
  end if;
end;
$function$;

do $$
declare
  table_name text;
begin
  for table_name in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  for table_name in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format('drop policy if exists %I on public.%I', 'Admins can manage ' || table_name, table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.bda_is_admin()) with check (public.bda_is_admin())',
      'Admins can manage ' || table_name,
      table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'barcoin_rules',
    'campeoes_barcoins',
    'canais_tv',
    'competition_achievements',
    'competition_matches',
    'competition_ranking_items',
    'competition_rankings',
    'competition_rewards',
    'competition_rounds',
    'competition_score_rules',
    'competition_seasons',
    'competition_stages',
    'competition_teams',
    'competitions',
    'events',
    'missions',
    'news_articles',
    'news_categories',
    'radio_stations',
    'ranking_barcoins',
    'ranking_boards',
    'ranking_entries',
    'store_products',
    'tv_channels'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists %I on public.%I', 'Public can read ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        'Public can read ' || table_name,
        table_name
      );
    end if;
  end loop;
end $$;

drop policy if exists "Admins can read radio music requests" on public.radio_music_requests;
drop policy if exists "Admins can update radio music requests" on public.radio_music_requests;
drop policy if exists "Admins can delete radio music requests" on public.radio_music_requests;
drop policy if exists "Radio staff can read radio music requests" on public.radio_music_requests;
drop policy if exists "Radio staff can update radio music requests" on public.radio_music_requests;
drop policy if exists "Admins can delete radio music requests safely" on public.radio_music_requests;

create policy "Radio staff can read radio music requests"
on public.radio_music_requests
for select
to authenticated
using (public.bda_is_radio_staff());

create policy "Radio staff can update radio music requests"
on public.radio_music_requests
for update
to authenticated
using (public.bda_is_radio_staff())
with check (public.bda_is_radio_staff());

create policy "Admins can delete radio music requests safely"
on public.radio_music_requests
for delete
to authenticated
using (public.bda_is_admin());

drop policy if exists logs_all on public.logs_barcoins;
drop policy if exists ranking_all on public.ranking_barcoins;
drop policy if exists usuarios_all on public.usuarios_barcoins;

drop policy if exists "Profiles can read own profile" on public.profiles;
drop policy if exists "Profiles can update own profile" on public.profiles;

create policy "Profiles can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Profiles can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'analytics_events',
    'barai_feedback',
    'barai_memory',
    'barai_messages',
    'barai_sessions',
    'barcoin_transactions',
    'barcoin_wallets',
    'competition_predictions',
    'profile_achievements',
    'profile_missions',
    'profile_preferences',
    'profile_stats',
    'store_orders',
    'store_redemptions'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists %I on public.%I', 'Users can read own ' || table_name, table_name);
      execute format('drop policy if exists %I on public.%I', 'Users can insert own ' || table_name, table_name);
      execute format('drop policy if exists %I on public.%I', 'Users can update own ' || table_name, table_name);

      execute format(
        'create policy %I on public.%I for select to authenticated using (auth.uid() = profile_id)',
        'Users can read own ' || table_name,
        table_name
      );
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (auth.uid() = profile_id)',
        'Users can insert own ' || table_name,
        table_name
      );
      execute format(
        'create policy %I on public.%I for update to authenticated using (auth.uid() = profile_id) with check (auth.uid() = profile_id)',
        'Users can update own ' || table_name,
        table_name
      );
    end if;
  end loop;
end $$;
