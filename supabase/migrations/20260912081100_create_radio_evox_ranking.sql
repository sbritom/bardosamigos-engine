create table if not exists public.radio_evox_ranking (
  id text primary key,
  period_label text not null default 'Últimos 7 dias',
  total_requests integer not null default 0 check (total_requests >= 0),
  unique_songs integer not null default 0 check (unique_songs >= 0),
  highlight_song text not null default '',
  highlight_artist text not null default '',
  ranking jsonb not null default '[]'::jsonb check (jsonb_typeof(ranking) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null
);

alter table public.radio_evox_ranking enable row level security;

revoke all on table public.radio_evox_ranking from anon, authenticated;
grant select on table public.radio_evox_ranking to anon, authenticated;
grant update on table public.radio_evox_ranking to authenticated;

drop policy if exists radio_evox_ranking_public_read on public.radio_evox_ranking;
create policy radio_evox_ranking_public_read
on public.radio_evox_ranking
for select
to anon, authenticated
using (id = 'imortal0800');

drop policy if exists radio_evox_ranking_staff_update on public.radio_evox_ranking;
create policy radio_evox_ranking_staff_update
on public.radio_evox_ranking
for update
to authenticated
using (
  id = 'imortal0800'
  and (
    coalesce(auth.jwt()->'app_metadata'->>'role', '') in ('admin', 'locutor')
    or coalesce(auth.jwt()->'app_metadata'->>'is_admin', '') = 'true'
  )
)
with check (
  id = 'imortal0800'
  and (
    coalesce(auth.jwt()->'app_metadata'->>'role', '') in ('admin', 'locutor')
    or coalesce(auth.jwt()->'app_metadata'->>'is_admin', '') = 'true'
  )
);

insert into public.radio_evox_ranking (
  id,
  period_label,
  total_requests,
  unique_songs,
  highlight_song,
  highlight_artist,
  ranking
)
values (
  'imortal0800',
  'Últimos 7 dias',
  0,
  0,
  '',
  '',
  '[]'::jsonb
)
on conflict (id) do nothing;
