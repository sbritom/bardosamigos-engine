create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  end if;
  if to_jsonb(new) ? 'version' then
    new.version = coalesce(old.version, 0) + 1;
  end if;
  return new;
end;
$$;

create or replace function public.ensure_updated_at_trigger(target_table regclass)
returns void
language plpgsql
as $$
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
$$;

create table if not exists public.radio_music_requests (
  id uuid primary key default gen_random_uuid(),
  song_and_artist text not null,
  message text,
  status text not null default 'pending',
  source text not null default 'public_radio_page',
  request_fingerprint text,
  requester_user_agent text,
  admin_note text,
  handled_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint radio_music_requests_status_check
    check (status in ('pending', 'read')),
  constraint radio_music_requests_song_not_empty
    check (length(btrim(song_and_artist)) >= 3)
);

create index if not exists radio_music_requests_status_idx
  on public.radio_music_requests (status);

create index if not exists radio_music_requests_created_at_desc_idx
  on public.radio_music_requests (created_at desc);

select public.ensure_updated_at_trigger('public.radio_music_requests'::regclass);

alter table public.radio_music_requests enable row level security;

drop policy if exists "Admins can read radio music requests" on public.radio_music_requests;
create policy "Admins can read radio music requests"
  on public.radio_music_requests
  for select
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  );

drop policy if exists "Admins can update radio music requests" on public.radio_music_requests;
create policy "Admins can update radio music requests"
  on public.radio_music_requests
  for update
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  )
  with check (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  );

drop policy if exists "Admins can delete radio music requests" on public.radio_music_requests;
create policy "Admins can delete radio music requests"
  on public.radio_music_requests
  for delete
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  );
