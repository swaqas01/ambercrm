-- 38_user_directory.sql
-- Amber Homes — safe user directory for activity/comment/follow-up attribution.
-- WHY: profiles RLS (profiles_read_self) lets a non-admin read ONLY their own profile row.
-- So the embedded actor/author join on lead_activity / lead_comments returns NULL for any
-- action performed by a *different* user, and the UI renders it as "System". This function
-- exposes ONLY id, full_name and role of ACTIVE users to authenticated callers — never phone,
-- email, 2FA flags, password fields or any other sensitive column — so the app can resolve a
-- name for every actor without weakening RLS on the profiles table itself.
-- SAFE & IDEMPOTENT. Deletes nothing. Does not alter any policy or table.

create or replace function public.user_directory()
returns table (id uuid, full_name text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select id, full_name, role
  from public.profiles
  where coalesce(active, true);
$$;

revoke all on function public.user_directory() from public;
grant execute on function public.user_directory() to authenticated;
