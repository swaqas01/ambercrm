-- 52_revoke_anon_all_tables.sql
-- Amber Homes — complete the anon lockdown the self-audit surfaced.
--
-- The June audit only named 10 tables; migration 49 closed those. But
-- security_self_audit() then revealed the same latent anon grants on MANY more
-- tables (deals, deal_documents, profiles, lead_reveals, auth_logs, auth_otp,
-- admin_audit, …) — and the list was truncated at 100 rows, so there are more.
-- Rather than chase a list, this revokes the anonymous role across EVERY table
-- in public, then re-grants the single privilege the app genuinely needs.
--
-- WHY THIS IS SAFE FOR LOGIN / 2FA (verified against api/auth.js):
--   • Login uses Supabase's auth endpoint (GoTrue), which does not depend on any
--     public-schema table grant — unaffected.
--   • The OTP / 2FA flow (auth_otp) is performed by the SERVICE ROLE in the
--     serverless function, which bypasses grants and RLS — unaffected.
--   • The serverless auth logging also uses the service role — unaffected.
--   • The ONLY anon table access in the app is the pre-login "forgot password
--     requested" log line the browser writes to auth_logs. We re-grant INSERT on
--     auth_logs (append only) so that keeps working; anon still cannot READ login
--     history or tamper with it.
-- Nothing here changes access for logged-in agents/admins. Reversible.

begin;

-- 1. Revoke ALL privileges for the anonymous role on every table in public.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on public.%I from anon', r.tablename);
  end loop;
end $$;

-- 2. Re-grant the one legitimate need: append-only forgot-password logging.
grant insert on public.auth_logs to anon;

-- 3. Teach the self-audit that this single grant is intentional, so a clean
--    system reports OK instead of flagging it forever.
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

  -- anon grants, EXCLUDING the intentional append-only forgot-password log
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
          and not (table_name = 'auth_logs' and privilege_type = 'INSERT')
     )
     and not exists (
        select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false
     )
  then
    return query select 'overall'::text, 'OK'::text,
                        'Anon has no table access (except append-only forgot-password log); RLS on for every table.'::text;
  end if;
end $$;

revoke all on function public.security_self_audit() from public, anon;
grant execute on function public.security_self_audit() to authenticated;

commit;

-- VERIFY (run after): expect the single row →
--   overall | OK | Anon has no table access (except append-only forgot-password log); ...
-- select * from public.security_self_audit();
