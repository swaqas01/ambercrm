-- VERIFY_anon_exposure.sql
-- Run this in Supabase -> SQL Editor BEFORE and AFTER applying 50_security_anon_lockdown.sql.
--
-- AFTER the fix, the `anon_privileges` column MUST read "(none)" for every row —
-- that proves the public/anon key can no longer touch these tables.
--
-- The `rls_enabled` column is diagnostic: any table showing FALSE has Row-Level
-- Security disabled in production (a separate hardening item — tell Claude which
-- ones are false and it will enable RLS with the correct staff/owner policy so
-- logged-in agents keep access).

select t.tablename,
       t.rowsecurity                                                  as rls_enabled,
       coalesce(string_agg(distinct g.privilege_type, ', '
                 order by g.privilege_type), '(none)')                as anon_privileges
from pg_tables t
left join information_schema.role_table_grants g
       on g.table_schema = 'public'
      and g.table_name   = t.tablename
      and g.grantee      = 'anon'
where t.schemaname = 'public'
  and t.tablename in (
        'leads','lead_activity','lead_comments','follow_ups',
        'hot_resale_deals','app_settings','ai_sources',
        'ai_knowledge','projects','project_files')
group by t.tablename, t.rowsecurity
order by t.tablename;
