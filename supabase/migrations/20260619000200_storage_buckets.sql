-- Storage buckets for Bar dos Amigos Engine.
-- Safe for projects that already have buckets or storage policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('media', 'media', true, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'audio/mpeg']),
  ('documents', 'documents', false, 10485760, array['application/pdf', 'text/plain']),
  ('store-assets', 'store-assets', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('news-assets', 'news-assets', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public read public buckets') then
    create policy "public read public buckets"
    on storage.objects for select
    using (bucket_id in ('avatars', 'media', 'store-assets', 'news-assets'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated upload own assets') then
    create policy "authenticated upload own assets"
    on storage.objects for insert
    with check (
      auth.role() = 'authenticated'
      and bucket_id in ('avatars', 'media', 'documents', 'store-assets', 'news-assets')
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'owners update own storage objects') then
    create policy "owners update own storage objects"
    on storage.objects for update
    using (auth.uid() = owner)
    with check (auth.uid() = owner);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'owners delete own storage objects') then
    create policy "owners delete own storage objects"
    on storage.objects for delete
    using (auth.uid() = owner);
  end if;
end;
$$;
