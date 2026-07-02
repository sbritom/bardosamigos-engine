create table if not exists public.layout_settings (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  component text not null,
  device text not null default 'desktop',
  status text not null default 'draft',
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'layout_settings_device_check'
      and conrelid = 'public.layout_settings'::regclass
  ) then
    alter table public.layout_settings
      add constraint layout_settings_device_check
      check (device in ('desktop', 'tablet', 'mobile')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'layout_settings_status_check'
      and conrelid = 'public.layout_settings'::regclass
  ) then
    alter table public.layout_settings
      add constraint layout_settings_status_check
      check (status in ('draft', 'published', 'reset')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'layout_settings_page_component_device_key'
      and conrelid = 'public.layout_settings'::regclass
  ) then
    alter table public.layout_settings
      add constraint layout_settings_page_component_device_key unique (page, component, device);
  end if;
end $$;

create index if not exists idx_layout_settings_page_device
  on public.layout_settings (page, device)
  where deleted_at is null;

create index if not exists idx_layout_settings_status
  on public.layout_settings (status)
  where deleted_at is null;

create index if not exists idx_layout_settings_updated_at
  on public.layout_settings (updated_at desc);

alter table public.layout_settings enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'ensure_updated_at_trigger'
      and pronamespace = 'public'::regnamespace
  ) then
    perform public.ensure_updated_at_trigger('public.layout_settings'::regclass);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'layout_settings'
      and policyname = 'layout_settings_admin_select'
  ) then
    create policy layout_settings_admin_select
      on public.layout_settings
      for select
      using (
        auth.role() = 'authenticated'
        and (
          auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
          or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
          or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
          or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'layout_settings'
      and policyname = 'layout_settings_admin_write'
  ) then
    create policy layout_settings_admin_write
      on public.layout_settings
      for all
      using (
        auth.role() = 'authenticated'
        and (
          auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
          or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
          or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
          or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
        )
      )
      with check (
        auth.role() = 'authenticated'
        and (
          auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
          or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
          or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
          or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
        )
      );
  end if;
end $$;
