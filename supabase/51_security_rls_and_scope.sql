-- 51_security_rls_and_scope.sql
-- Amber Homes — security hardening that BUILDS ON migrations 49 & 50 (anonymous-role revoke).
-- 49/50 already revoked every privilege from the `anon` role on the ten exposed tables, which is the
-- definitive close for F-1 (anonymous read) and F-3 (anonymous write). This migration adds two things:
--
--   (1) Belt-and-suspenders: ensure Row-Level Security is ENABLED on all ten tables, so LOGGED-IN
--       (authenticated) staff are always constrained by the per-agent ownership/admin policies — not
--       only the anon role. No-op where RLS is already on (it is, per the live pg_tables check), and
--       it never weakens a per-agent policy.
--   (2) Least-privilege on the two config/AI read policies that previously targeted the public role:
--         app_settings -> Admin/Master read only (the non-sensitive web_research / device_limit flags;
--                         the admin Devices screen + Master AI screen read them; the AI proxy now reads
--                         them server-side with the service-role key).
--         ai_knowledge -> authenticated staff read active, agent-visible items; Admin reads all.
--
-- Idempotent and transaction-wrapped. Touches no data. Run AFTER 49 and 50 (order: 49, 50, 51).

begin;

-- (1) Ensure RLS is on for all ten tables (no-op if already enabled).
alter table public.leads             enable row level security;
alter table public.lead_activity     enable row level security;
alter table public.lead_comments     enable row level security;
alter table public.follow_ups        enable row level security;
alter table public.hot_resale_deals  enable row level security;
alter table public.projects          enable row level security;
alter table public.project_files     enable row level security;
alter table public.ai_knowledge      enable row level security;
alter table public.ai_sources        enable row level security;
alter table public.app_settings      enable row level security;

-- (2a) app_settings: Admin + Master read the non-sensitive flags; writes stay Master-only (unchanged).
drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings
  for select to authenticated using ( (select public.is_admin()) );

-- (2b) ai_knowledge: authenticated staff read active+agent-visible; Admin reads all.
drop policy if exists ai_knowledge_select on public.ai_knowledge;
create policy ai_knowledge_select on public.ai_knowledge
  for select to authenticated using (
    (select public.is_admin())
    or (status = 'active' and deleted = false and visibility <> 'admin_only')
  );

commit;

-- VERIFY (read-only): all ten show rls_on = t with policies > 0.
select t.tablename, t.rowsecurity as rls_on,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=t.tablename) as policies
from pg_tables t
where t.schemaname='public'
  and t.tablename in ('leads','lead_activity','lead_comments','follow_ups','hot_resale_deals',
                      'projects','project_files','ai_knowledge','ai_sources','app_settings')
order by t.rowsecurity, t.tablename;
