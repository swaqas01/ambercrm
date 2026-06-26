-- 49_close_anon_read_exposure.sql
-- Amber Homes — CRITICAL FIX for F-1 (anonymous data exposure).
--
-- CAUSE (confirmed): RLS is ENABLED on every table (your pg_tables query shows rowsecurity=true on all
-- 37). The exposure is NOT disabled RLS. It is that these tables' SELECT policies apply to the `public`
-- role — which in Postgres includes the unauthenticated `anon` role — AND contain a branch with no
-- login check (leads.is_open=true, projects.agent_visible=true, ai_knowledge active, ai_sources active,
-- app_settings `true`, hot_resale_deals status='Approved', and the lead_activity/lead_comments/
-- follow_ups EXISTS-on-open-lead branches). So an anonymous visitor with the public key reads those rows.
--
-- FIX: this is an INTERNAL CRM — nothing here should be readable without logging in. We revoke ALL
-- privileges for the anonymous role on exactly the tables the audit found open. The existing per-agent
-- policies are NOT changed, so logged-in agents keep precisely the access they have today. This closes
-- both the read exposure (F-1) and any anonymous write (F-3) on these tables in one step.
--
-- VERIFY AFTER RUNNING (two checks, both below) — do not take my word for it this time.

begin;

revoke all on public.leads            from anon;
revoke all on public.lead_activity    from anon;
revoke all on public.lead_comments    from anon;
revoke all on public.follow_ups       from anon;
revoke all on public.hot_resale_deals from anon;
revoke all on public.projects         from anon;
revoke all on public.project_files    from anon;
revoke all on public.ai_knowledge     from anon;
revoke all on public.ai_sources       from anon;
revoke all on public.app_settings     from anon;

commit;

-- ── VERIFICATION 1 — run this; it must return ZERO rows (anon has no grants left on these tables) ──
-- select table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public' and grantee = 'anon'
--   and table_name in ('leads','lead_activity','lead_comments','follow_ups','hot_resale_deals',
--                      'projects','project_files','ai_knowledge','ai_sources','app_settings');
--
-- ── VERIFICATION 2 — the real external test (run in a terminal, NOT the SQL editor). Both requests
--    should now return an empty list [] or a permission error, not lead data: ──
-- curl 'https://fkeniejcitwlqfatkopi.supabase.co/rest/v1/leads?select=id&limit=1' \
--   -H 'apikey: sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ' \
--   -H 'Authorization: Bearer sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ'
