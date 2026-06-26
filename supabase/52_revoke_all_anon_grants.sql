-- 52_revoke_all_anon_grants.sql
-- Amber Homes — DEFENSE IN DEPTH: remove ALL anonymous table access.
--
-- WHY: security_self_audit() revealed that the anonymous role still held full
-- grants (SELECT/INSERT/UPDATE/DELETE/...) on ~27 tables beyond the 10 that
-- migration 49 closed. Those tables were protected ONLY by their RLS policies —
-- one layer. The external auditor saw them as "Protected" because RLS returned
-- empty, but the table-level door was still unlocked. This migration locks it.
--
-- VERIFIED SAFE (against the live code, this session):
--   • auth_otp (2FA codes) is touched ONLY by api/auth.js as the SERVICE ROLE,
--     which bypasses grants — so revoking anon does NOT affect 2FA/login.
--   • Every business table (profiles, deals, deal_documents, admin_audit, ...)
--     is queried by the client ONLY after login, as the `authenticated` role.
--     Revoking `anon` does not change authenticated access at all.
--   • The ONE thing the logged-out client does is INSERT an auth_logs row in the
--     forgot-password flow — so we re-grant exactly that, nothing more.
--
-- Logged-in agents/admins/master are UNAFFECTED. Reversible. Transaction-wrapped.

begin;

-- 1. Default deny: strip every privilege the anonymous role holds on every
--    table and view in the public schema.
revoke all on all tables in schema public from anon;

-- 2. Explicit allow: the only legitimate pre-auth client write. Write-only —
--    anon can append a login/forgot-password event but cannot read the audit
--    log, nor touch any other table.
grant insert on public.auth_logs to anon;

-- 3. Update the self-audit to treat that single intentional grant as acceptable,
--    so a clean system reports OK instead of flagging the deliberate exception.
create or replace function public.security_self_audit()
returns table(check_name text, status text, detail text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and coalesce((select role::text from public.profiles where id = auth.uid()), '') <> 'master_admin' then
    raise exception 'security_self_audit: master admin only';
  end if;

  -- anon grants, EXCLUDING the one intentional exception (auth_logs INSERT)
  return query
    select 'anon_table_grant'::text, 'EXPOSED'::text,
           format('anon has %s on %I.%I', g.privilege_type, g.table_schema, g.table_name)::text
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee = 'anon'
      and not (g.table_name = 'auth_logs' and g.privilege_type = 'INSERT');

  -- tables with RLS disabled
  return query
    select 'rls_disabled'::text, 'EXPOSED'::text,
           format('RLS is OFF on %I.%I', n.nspname, c.relname)::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;

  -- clean bill of health
  if not exists (
        select 1 from information_schema.role_table_grants
        where table_schema='public' and grantee='anon'
          and not (table_name='auth_logs' and privilege_type='INSERT')
     )
     and not exists (
        select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false
     )
  then
    return query select 'overall'::text, 'OK'::text,
      'No anon grants (except intentional auth_logs INSERT) and RLS enabled on every public table.'::text;
  end if;
end $$;

revoke all on function public.security_self_audit() from public, anon;
grant execute on function public.security_self_audit() to authenticated;

commit;

-- AFTER RUNNING, re-run — expect a single OK row:
--   select * from public.security_self_audit();
