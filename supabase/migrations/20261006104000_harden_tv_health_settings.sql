drop policy if exists "tv_health_settings_deny_read" on public.tv_health_settings;

create policy "tv_health_settings_deny_read"
  on public.tv_health_settings
  for select
  to anon, authenticated
  using (false);
