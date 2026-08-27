create table if not exists public.tv_channel_candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (
    lower(
      regexp_replace(
        translate(
          name,
          'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
          'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
        ),
        '[^a-zA-Z0-9]+',
        '',
        'g'
      )
    )
  ) stored,
  category_hint text,
  source_names text[] not null default '{}'::text[],
  source_urls text[] not null default '{}'::text[],
  authorization_status text not null default 'unknown'
    check (authorization_status in ('unknown','official','authorized','unverified','restricted','rejected')),
  review_status text not null default 'pending'
    check (review_status in ('pending','approved','rejected','needs_source')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tv_channel_candidates_normalized_name_uidx
  on public.tv_channel_candidates (normalized_name);

create index if not exists tv_channel_candidates_review_status_idx
  on public.tv_channel_candidates (review_status, authorization_status);

alter table public.tv_channel_candidates enable row level security;

drop policy if exists "tv_channel_candidates_admin_select" on public.tv_channel_candidates;
drop policy if exists "tv_channel_candidates_admin_insert" on public.tv_channel_candidates;
drop policy if exists "tv_channel_candidates_admin_update" on public.tv_channel_candidates;
drop policy if exists "tv_channel_candidates_admin_delete" on public.tv_channel_candidates;

create policy "tv_channel_candidates_admin_select"
  on public.tv_channel_candidates for select
  using (public.bda_is_admin());

create policy "tv_channel_candidates_admin_insert"
  on public.tv_channel_candidates for insert
  with check (public.bda_is_admin());

create policy "tv_channel_candidates_admin_update"
  on public.tv_channel_candidates for update
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "tv_channel_candidates_admin_delete"
  on public.tv_channel_candidates for delete
  using (public.bda_is_admin());

select public.ensure_updated_at_trigger('public.tv_channel_candidates'::regclass);

grant select, insert, update, delete on public.tv_channel_candidates to authenticated;
revoke all on public.tv_channel_candidates from anon;
