-- Three-level access hierarchy:
-- admin: full operational and role-management access
-- property_manager: all business records and member management, but no role management
-- member: own profile, properties, submissions and feedback only

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_property_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'property_manager'
  );
$$;

revoke all on function public.is_property_manager() from public;
grant execute on function public.is_property_manager() to authenticated;

-- Only administrators can change an account's access role. This trigger is the
-- final guard even when a row is updated through SQL clients or future app code.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role is distinct from new.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only administrators may change account roles';
  end if;
  return new;
end;
$$;

-- Members may update themselves. Administrators may update everyone. Property
-- managers may update member profiles, but not administrators or other managers.
drop policy if exists "profiles_update_own_or_staff" on public.profiles;
create policy "profiles_update_by_role" on public.profiles for update
using (
  id = (select auth.uid())
  or public.is_admin()
  or (public.is_property_manager() and role = 'member')
)
with check (
  id = (select auth.uid())
  or public.is_admin()
  or (public.is_property_manager() and role = 'member')
);

-- Keep role functions aligned with the hierarchy used by all existing RLS
-- policies. Both staff levels can read and manage operational records.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or public.is_property_manager();
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;
