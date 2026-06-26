-- 50_permanent_security_hardening.sql
-- Amber Homes — PERMANENT, STRUCTURAL defense against anon data exposure.
--
-- This complements migration 49 (which closed the 10 exposed tables). Where 49
-- fixed the tables that were already open, THIS migration stops the same mistake
-- from ever happening again, at the database level, and gives you a one-command
-- audit you can run forever.
--
-- It does THREE things, all safe for a live system:
--   A. Stops FUTURE tables from auto-granting access to the anonymous role.
--      The root cause in June 2026 was new tables inheriting a default grant to
--      `anon`. After this runs, any table you create later starts with NO anon
--      access — you must opt in deliberately. For an internal CRM with no public
--      pages, that is exactly the behaviour you want.
--   B. Hardens the anon role itself so it cannot create objects in the schema.
--   C. Installs security_self_audit() — a read-only, master-admin-only function
--      that returns every table an anonymous user can currently reach, plus the
--      RLS status of every table. The scanner and you both call this.
--
-- It does NOT touch any existing table's data, policies, or the access that
-- logged-in agents/admins have today. Reversible. Wrapped in a transaction.

begin;

-- ── A. No anonymous access on FUTURE tables (the permanent root-cause fix) ──
-- Default privileges only affect objects created AFTER this runs. Existing
-- tables are unchanged (49 already handled the exposed ones).
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- ── B. The anonymous role must never be able to create objects ──
revoke create on schema public from anon;

-- ── C. Read-only self-audit, callable only by the master admin ──
create or replace function public.security_self_audit()
returns table(check_name text, status text, detail text)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- gate: block an authenticated NON-master app user; allow SQL-editor/service
  -- context (auth.uid() null). Cast enum role to text for a safe comparison.
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

commit;

-- ── HOW TO USE (run anytime in the SQL editor, as the master admin) ──
--   select * from public.security_self_audit();
-- Expect a single row:  overall | OK | No anon table grants and RLS enabled ...
-- Any row marked EXPOSED is a live problem and names the exact table.
