-- Security hardening: remove legacy admin recovery and narrow public policies.

drop table if exists public.admin_recovery_codes;

drop policy if exists "Public can read events" on public.events;
drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
on public.events
for select
to anon, authenticated
using (
  (status = 'published' and deleted_at is null)
  or (select public.bda_is_admin())
);

alter policy "football_favorites_insert_own"
on public.football_favorites
to authenticated;

alter policy "football_favorites_update_own"
on public.football_favorites
to authenticated;

alter policy "tv_channel_candidates_admin_insert"
on public.tv_channel_candidates
to authenticated;

alter policy "tv_channel_candidates_admin_update"
on public.tv_channel_candidates
to authenticated;

alter policy "tv_channel_candidates_admin_delete"
on public.tv_channel_candidates
to authenticated;

drop policy if exists "Admins can manage radio_music_requests"
on public.radio_music_requests;
