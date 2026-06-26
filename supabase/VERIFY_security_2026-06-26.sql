-- VERIFY_security_2026-06-26.sql   ·   READ-ONLY. Safe to run in Supabase → SQL Editor. Changes nothing.
-- Confirms the live database after running 50_security_rls_lockdown.sql. Every block has an expected result.

-- 1) RLS must be ON (rls_on = t) with policies > 0 for each previously-exposed table.
select t.tablename, t.rowsecurity as rls_on,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=t.tablename) as policies
from pg_tables t
where t.schemaname='public'
  and t.tablename in ('leads','lead_activity','lead_comments','ai_knowledge','ai_sources',
                      'app_settings','projects','project_files','hot_resale_deals','follow_ups')
order by t.rowsecurity, t.tablename;   -- RED FLAG: any rls_on = f, or policies = 0

-- 2) NO anonymous/PUBLIC *permissive* (using=true) read policy may remain on ANY public table.
--    Expected: ZERO rows.
select c.relname as table, pol.polname as policy,
       pg_get_expr(pol.polqual, pol.polrelid) as using_expr
from pg_policy pol
join pg_class c     on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public'
  and ( pol.polroles @> array[(select oid from pg_roles where rolname='anon')] or pol.polroles='{0}' )
  and coalesce(pg_get_expr(pol.polqual, pol.polrelid),'') = 'true'
order by c.relname;

-- 3) Any policy still naming the anon role on the ten tables (expected: ZERO rows — all are authenticated/role-based now).
select c.relname as table, pol.polname as policy, pol.polcmd as cmd
from pg_policy pol
join pg_class c     on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public'
  and c.relname in ('leads','lead_activity','lead_comments','ai_knowledge','ai_sources',
                    'app_settings','projects','project_files','hot_resale_deals','follow_ups')
  and pol.polroles @> array[(select oid from pg_roles where rolname='anon')]
order by c.relname;

-- 4) No custom function should be EXECUTE-able by anon (locked in migration 43). Expected: ZERO rows.
select p.proname as function_still_anon_executable
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.prokind='f'
  and has_function_privilege('anon', p.oid, 'EXECUTE')
order by p.proname;

-- 5) Storage bucket privacy. Expected: deal-docs = false (PRIVATE). avatars = true (intentional public photos).
--    project-files = true (PUBLIC by URL — listing disabled; see runbook §6 for the optional private+signed fix).
select id, name, public as is_public from storage.buckets order by id;

-- 6) Which buckets allow listing/SELECT via a storage.objects policy (informational).
select polname as storage_policy, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy where polrelid = 'storage.objects'::regclass and polcmd in ('r','*')
order by polname;

-- 7) Master admin must be exactly one, active.
select email, role, active from public.profiles where role = 'master_admin';
