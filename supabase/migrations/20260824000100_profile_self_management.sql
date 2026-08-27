-- Ensure authenticated users can bootstrap and maintain their own public profile row.
-- Safe for projects where auth users existed before the profile trigger was installed.

insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data->>'display_name', ''),
    nullif(users.raw_user_meta_data->>'name', ''),
    users.email,
    'Amigo do Bar'
  )
from auth.users as users
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles insert own'
  ) then
    create policy "profiles insert own"
    on public.profiles
    for insert
    with check (id = auth.uid());
  end if;
end;
$$;
