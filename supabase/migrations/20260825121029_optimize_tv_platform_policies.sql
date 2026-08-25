-- Remove overlapping TV policies and cover channel foreign keys.

create index if not exists tv_featured_channel_id_idx
  on public.tv_featured (channel_id);
create index if not exists tv_favorites_channel_id_idx
  on public.tv_favorites (channel_id);
create index if not exists tv_recent_channel_id_idx
  on public.tv_recent (channel_id);

-- tv_channels already has granular admin INSERT/UPDATE/DELETE policies from the
-- legacy schema. Keep those and remove the overlapping ALL policy.
drop policy if exists "Admins can manage tv_channels" on public.tv_channels;

-- Categories: public/admin SELECT stays in one policy; writes are granular so
-- authenticated admins do not evaluate two permissive SELECT policies.
drop policy if exists "tv categories admin write" on public.tv_categories;
drop policy if exists "tv categories admin insert" on public.tv_categories;
drop policy if exists "tv categories admin update" on public.tv_categories;
drop policy if exists "tv categories admin delete" on public.tv_categories;

create policy "tv categories admin insert"
  on public.tv_categories
  for insert
  to authenticated
  with check (public.bda_is_admin());

create policy "tv categories admin update"
  on public.tv_categories
  for update
  to authenticated
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "tv categories admin delete"
  on public.tv_categories
  for delete
  to authenticated
  using (public.bda_is_admin());

-- Featured: admins must also be able to inspect inactive/expired featured rows.
drop policy if exists "tv featured public read" on public.tv_featured;
create policy "tv featured public read"
  on public.tv_featured
  for select
  to anon, authenticated
  using (
    public.bda_is_admin()
    or (
      exists (
        select 1
        from public.tv_channels channel
        where channel.id = channel_id
          and channel.enabled = true
      )
      and (start_at is null or start_at <= now())
      and (end_at is null or end_at >= now())
    )
  );

drop policy if exists "tv featured admin write" on public.tv_featured;
drop policy if exists "tv featured admin insert" on public.tv_featured;
drop policy if exists "tv featured admin update" on public.tv_featured;
drop policy if exists "tv featured admin delete" on public.tv_featured;

create policy "tv featured admin insert"
  on public.tv_featured
  for insert
  to authenticated
  with check (public.bda_is_admin());

create policy "tv featured admin update"
  on public.tv_featured
  for update
  to authenticated
  using (public.bda_is_admin())
  with check (public.bda_is_admin());

create policy "tv featured admin delete"
  on public.tv_featured
  for delete
  to authenticated
  using (public.bda_is_admin());
