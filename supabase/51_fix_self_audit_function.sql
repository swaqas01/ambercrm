-- 51_fix_self_audit_function.sql
-- Fixes two bugs in security_self_audit() from migration 50. The structural
-- parts of 50 (default-deny anon on future tables) already applied correctly —
-- this only replaces the function body. Run this, then re-run:
--     select * from public.security_self_audit();
--
-- Bug 1: profiles.role is an enum (user_role), so coalesce(role, '') tried to
--        coerce '' into the enum and failed. Fixed by casting role to text.
-- Bug 2: when run from the SQL editor there is no app user, so auth.uid() is
--        null and the master-admin gate wrongly blocked it. Fixed by only
--        enforcing the gate when an authenticated app user IS present (the SQL
--        editor / service-role context is already privileged).

create or replace function public.security_self_audit()
returns table(check_name text, status text, detail text)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Gate: block an authenticated NON-master app user calling this via the API.
  -- If auth.uid() is null (SQL editor / service role), the context is already
  -- privileged, so allow it. Cast the enum role to text for a safe comparison.
  if auth.uid() is not null
     and coalesce((select role::text from public.profiles where id = auth.uid()), '') <> 'master_admin' then
    raise exception 'security_self_audit: master admin only';
  end if;

  -- 1. any table the anonymous role still holds privileges on
  return query
    select 'anon_table_grant'::text,
           'EXPOSED'::text,
           format('anon has %s on %I.%I', g.privilege_type, g.table_schema, g.table_name)::text
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee = 'anon';

  -- 2. any table in public with RLS disabled
  return query
    select 'rls_disabled'::text,
           'EXPOSED'::text,
           format('RLS is OFF on %I.%I', n.nspname, c.relname)::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;

  -- 3. clean bill of health if nothing above returned
  if not exists (
        select 1 from information_schema.role_table_grants
        where table_schema='public' and grantee='anon'
     )
     and not exists (
        select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false
     )
  then
    return query select 'overall'::text, 'OK'::text,
                        'No anon table grants and RLS enabled on every public table.'::text;
  end if;
end $$;

revoke all on function public.security_self_audit() from public, anon;
grant execute on function public.security_self_audit() to authenticated;
