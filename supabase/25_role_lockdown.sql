-- 25_role_lockdown.sql
-- Amber Homes — pre-launch SERVER-SIDE role lockdown.
-- SAFE / IDEMPOTENT / ADDITIVE. Changes only SELECT policies, deletes no data.
--
-- Background: is_admin() = role in ('master_admin','admin'); is_master() = role 'master_admin'.
-- Today, leads / ai_logs / security_alerts / admin_audit grant full read to is_admin(), i.e. BOTH
-- master_admin AND the operational 'admin' role. The launch spec requires the 'admin' role to be
-- limited (create + assign leads only; no AI logs, no suspicious activity, no audit, no browsing all
-- leads — even via direct API/dev tools). sales_manager / marketing / accounts are NOT is_admin(), so
-- they already only read own/open and are unaffected by this migration. master_admin is unaffected
-- (is_master() stays true). This migration ONLY removes the 'admin' role's broad read.
--
-- ROLLBACK (if ever needed): re-run the original policy bodies from 01_schema.sql / 04_users.sql /
-- 06_ai_logs.sql / 23_open_leads_security.sql (which use public.is_admin()).

-- helper: true only for the operational Admin role
create or replace function public.is_ops_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- LEADS: master sees all; everyone else sees own/created/current/open; the operational Admin ALSO sees
-- unassigned leads (so they can assign them) — but NOT leads already assigned to another agent.
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select using (
  public.is_master()
  or ( deleted = false and (
        assigned_agent = auth.uid()
        or current_owner  = auth.uid()
        or created_by     = auth.uid()
        or is_open = true
        or ( public.is_ops_admin() and assigned_agent is null )
  ) )
);

-- AI LOGS: only the owner of the log and the master admin (Admin must not read team AI logs).
drop policy if exists ai_logs_select on public.ai_logs;
create policy ai_logs_select on public.ai_logs for select using ( user_id = auth.uid() or public.is_master() );

-- SECURITY ALERTS (suspicious activity): master admin only.
drop policy if exists sa_admin_select on public.security_alerts;
create policy sa_admin_select on public.security_alerts for select using ( public.is_master() );
drop policy if exists sa_admin_update on public.security_alerts;
create policy sa_admin_update on public.security_alerts for update using ( public.is_master() ) with check ( public.is_master() );

-- ADMIN AUDIT (security log): master admin only.
drop policy if exists admin_audit_select on public.admin_audit;
create policy admin_audit_select on public.admin_audit for select using ( public.is_master() );

-- NOTE — intentionally NOT changed (operational Admin still needs these per the spec):
--   * leads INSERT/UPDATE  → Admin can still create and assign leads.
--   * profiles SELECT      → Admin still reads the agent list (needed to pick an assignee).
--   * deals / hot_resale_deals SELECT → Admin still views and approves deals/listings.
--   * ai_knowledge SELECT  → unchanged so every role's Ask Amber keeps normal (non-admin-only) context.
