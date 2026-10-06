-- Perfil + Storage hardening for IMORTAL0800.

-- The avatars bucket is intentionally dedicated to public profile pictures.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Remove obsolete legacy Storage policies. No objects are deleted here.
drop policy if exists "BarStudio upload 1ps738_0" on storage.objects;
drop policy if exists "Permitir leitura publica no barstudio" on storage.objects;
drop policy if exists "Permitir upload publico no barstudio" on storage.objects;

-- Authenticated users can only manage avatar object metadata inside their own folder.
drop policy if exists "avatars select own metadata" on storage.objects;
drop policy if exists "avatars insert own folder" on storage.objects;
drop policy if exists "avatars update own folder" on storage.objects;
drop policy if exists "avatars delete own folder" on storage.objects;

create policy "avatars select own metadata"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "avatars insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "avatars update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "avatars delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Users may edit personal fields, but authorization/system fields stay server-managed.
create or replace function public.protect_profile_managed_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  jwt jsonb := coalesce((select auth.jwt()), '{}'::jsonb);
  is_admin boolean := (
    coalesce(jwt -> 'app_metadata' ->> 'role', '') = 'admin'
    or lower(coalesce(jwt -> 'app_metadata' ->> 'is_admin', 'false')) = 'true'
  );
  is_trusted_role boolean := current_user in ('postgres', 'service_role', 'supabase_admin');
begin
  if is_trusted_role or is_admin then
    if tg_op = 'UPDATE' then
      new.updated_at := now();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.id is distinct from (select auth.uid()) then
      raise exception 'Profile owner mismatch.' using errcode = '42501';
    end if;

    if new.role is distinct from 'user'::public.app_role
      or new.status is distinct from 'active'
      or new.metadata is distinct from '{}'::jsonb
      or new.deleted_at is not null
      or new.version is distinct from 1
    then
      raise exception 'Managed profile fields cannot be set by the user.' using errcode = '42501';
    end if;

    return new;
  end if;

  if new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.metadata is distinct from old.metadata
    or new.deleted_at is distinct from old.deleted_at
    or new.created_at is distinct from old.created_at
    or new.version is distinct from old.version
  then
    raise exception 'Managed profile fields cannot be changed by the user.' using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.protect_profile_managed_fields() from public, anon, authenticated;

drop trigger if exists protect_profile_managed_fields on public.profiles;

create trigger protect_profile_managed_fields
before insert or update on public.profiles
for each row
execute function public.protect_profile_managed_fields();
