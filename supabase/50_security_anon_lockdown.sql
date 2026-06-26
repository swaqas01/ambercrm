-- 50_security_anon_lockdown.sql
-- ============================================================================
-- CRITICAL SECURITY FIX — remove ALL anonymous (not-logged-in) access to the
-- sensitive tables flagged in the 26 Jun 2026 external assessment (findings F-1 & F-3).
--
-- HOW IT WORKS: in Postgres, reading or writing a table needs BOTH a table-level
-- privilege AND passing Row-Level Security. By revoking every privilege from the
-- `anon` role (the public key that ships inside the website's JavaScript), the
-- unauthenticated public can no longer read OR write these tables — regardless of
-- what any RLS policy says. This is the definitive stop for the public data exposure.
--
-- WHY IT IS SAFE: it touches ONLY the `anon` role. The `authenticated` role
-- (logged-in staff) and `service_role` (server admin functions in /api) keep their
-- own grants, so the app and admin tools are completely unaffected. Verified: no
-- legitimate code path reads these tables as anon (logged-in users are
-- `authenticated`; api/admin.js uses the service-role key).
--
-- Idempotent and non-destructive. Run in Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

-- 1) HARD STOP: revoke every privilege from the public/anon key on all 10 tables.
revoke all privileges on table
  public.leads,
  public.lead_activity,
  public.lead_comments,
  public.follow_ups,
  public.hot_resale_deals,
  public.app_settings,
  public.ai_sources,
  public.ai_knowledge,
  public.projects,
  public.project_files
from anon;

-- 2) The only two policies in the codebase that explicitly allowed the anon role
--    were app_settings_read and ai_sources_read (14_ai_sources.sql, `using (true)`
--    / `to anon`). Re-create them as AUTHENTICATED-ONLY and make sure RLS is on for
--    these two. We own these policies, so enabling RLS here cannot lock out staff.
alter table public.app_settings enable row level security;
drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings
  for select to authenticated using (true);

alter table public.ai_sources enable row level security;
drop policy if exists ai_sources_read on public.ai_sources;
create policy ai_sources_read on public.ai_sources
  for select to authenticated using (active or public.is_master());

-- Note: RLS is intentionally NOT toggled on the other 8 tables here — the revoke
-- above already closes the public exposure, and the companion VERIFY query will
-- reveal whether any table has RLS disabled in production so it can be hardened
-- next without risking logged-in agents' access.
