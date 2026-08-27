do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'layout_settings_page_component_device_key'
      and conrelid = 'public.layout_settings'::regclass
  ) then
    alter table public.layout_settings
      drop constraint layout_settings_page_component_device_key;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'layout_settings_page_component_device_status_key'
      and conrelid = 'public.layout_settings'::regclass
  ) then
    alter table public.layout_settings
      add constraint layout_settings_page_component_device_status_key unique (page, component, device, status);
  end if;
end $$;

create index if not exists idx_layout_settings_runtime_lookup
  on public.layout_settings (page, component, device, status)
  where deleted_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'layout_settings'
      and policyname = 'layout_settings_published_select'
  ) then
    create policy layout_settings_published_select
      on public.layout_settings
      for select
      using (status = 'published' and deleted_at is null);
  end if;
end $$;
