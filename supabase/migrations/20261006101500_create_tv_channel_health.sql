create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.tv_channel_health (
  channel_id uuid primary key references public.tv_channels(id) on delete cascade,
  provider text not null,
  status text not null default 'unknown'
    check (status in ('unknown', 'healthy', 'degraded', 'down')),
  http_status integer,
  latency_ms integer,
  manifest_ok boolean,
  final_url text,
  message text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tv_channel_health_status_checked_idx
  on public.tv_channel_health (status, checked_at desc);

create table if not exists public.tv_health_settings (
  key text primary key,
  value_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tv_channel_health enable row level security;
alter table public.tv_health_settings enable row level security;

drop policy if exists "tv_channel_health_admin_read" on public.tv_channel_health;

create policy "tv_channel_health_admin_read"
  on public.tv_channel_health
  for select
  to authenticated
  using (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin')
    or lower(coalesce((select auth.jwt()) -> 'app_metadata' ->> 'is_admin', 'false')) = 'true'
  );

revoke all on public.tv_channel_health from anon;
revoke insert, update, delete on public.tv_channel_health from authenticated;
grant select on public.tv_channel_health to authenticated;

revoke all on public.tv_health_settings from anon, authenticated;

select cron.schedule(
  'tv-channel-health-every-6h',
  '17 */6 * * *',
  $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'tv_health_project_url')
        || '/functions/v1/tv-health',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'tv_health_anon_key'),
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'tv_health_anon_key'),
        'x-tv-health-token', (select decrypted_secret from vault.decrypted_secrets where name = 'tv_health_cron_token')
      ),
      body := '{"source":"cron","scope":"all"}'::jsonb,
      timeout_milliseconds := 120000
    );
  $cron$
);
