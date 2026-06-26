-- 53_lock_function_execute.sql
-- Amber Homes — close the RPC/function layer to anonymous callers (audit FIX-1).
--
-- FINDING: Postgres grants EXECUTE on every NEW function to PUBLIC by default.
-- Migration 43 revoked that on the functions that existed then, but the four
-- data_calling_* functions created later (in 49_data_calling_app.sql) were never
-- revoked, so they are callable by the anonymous role. (They have internal
-- manager guards, so they return no data to anon — but a function that is
-- anonymously callable at all is the wrong default, and the next one written
-- might not guard itself.)
--
-- FIX (matches the audit, applied the safe way for a live system):
--   1. Revoke EXECUTE from anon and PUBLIC on every function in public.
--   2. Grant EXECUTE to `authenticated` on every function, so the app keeps
--      working exactly as today. The sensitive functions already enforce their
--      own role checks internally (is_admin / manager / owner), so this changes
--      nothing for logged-in users — it only removes the anonymous door.
--   3. Stop FUTURE functions from being auto-granted to anon/PUBLIC.
--   4. Teach security_self_audit() to also report any anon-executable function,
--      so this gap can never hide again (it previously only checked tables).
--
-- This is safe post-migration-52: anon now has no table access and triggers no
-- RLS evaluation, so no policy needs anon to execute a helper function.
-- Logged-in users unaffected. Reversible. Transaction-wrapped.

begin;

-- 1 + 2: close to anon/public, (re)open to authenticated
revoke execute on all functions in schema public from anon, public;
grant  execute on all functions in schema public to authenticated;

-- 3: future functions are not auto-exposed to anon/public
alter default privileges in schema public revoke execute on functions from anon, public;

-- 4: extend the self-audit to cover the function layer
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

  -- anon table grants (except the intentional auth_logs INSERT)
  return query
    select 'anon_table_grant'::text, 'EXPOSED'::text,
           format('anon has %s on %I.%I', g.privilege_type, g.table_schema, g.table_name)::text
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee = 'anon'
      and not (g.table_name = 'auth_logs' and g.privilege_type = 'INSERT');

  -- anon-executable functions (the FIX-1 gap)
  return query
    select 'anon_function_exec'::text, 'EXPOSED'::text,
           format('anon can execute %I.%I(%s)', n.nspname, p.proname,
                  pg_get_function_identity_arguments(p.oid))::text
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');

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
          and not (table_name='auth_logs' and privilege_type='INSERT'))
     and not exists (
        select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE'))
     and not exists (
        select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false)
  then
    return query select 'overall'::text, 'OK'::text,
      'No anon table grants, no anon-executable functions, RLS on every table.'::text;
  end if;
end $$;

revoke all on function public.security_self_audit() from public, anon;
grant execute on function public.security_self_audit() to authenticated;

commit;

-- VERIFY (read-only), two ways:
--   select * from public.security_self_audit();   -- expect single OK row
-- and from a terminal, the function the auditor flagged should now refuse anon:
--   curl -s -o /dev/null -w "%{http_code}\n" \
--     'https://fkeniejcitwlqfatkopi.supabase.co/rest/v1/rpc/data_calling_manager_stats' \
--     -H 'apikey: sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ' \
--     -H 'Authorization: Bearer sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ' \
--     -H 'Content-Type: application/json' -d '{}'
--   -> expect 401 (was 200).
