-- 45_rls_initplan_leads.sql
-- Amber Homes — performance fix for the leads table RLS (Performance Advisor: auth_rls_initplan).
-- SAFE: the access logic is IDENTICAL to the current policies. The ONLY change is wrapping
-- auth.uid() / is_master() / is_admin() / is_ops_admin() in a scalar sub-select so Postgres
-- evaluates each ONCE per query instead of once per row. On ~7k leads this is the single biggest
-- query speedup available — it directly targets the 1–3.7s leads list/search queries.
--
-- These ALTER POLICY statements only replace the policy expressions; role targeting is unchanged.
-- ROLLBACK: re-run the bodies in 25_role_lockdown.sql (leads_select) and 01_schema.sql (the rest).

-- SELECT — master sees all; everyone else own/created/current/open; ops-admin also sees unassigned.
alter policy leads_select on public.leads using (
  (select public.is_master())
  or ( deleted = false and (
        assigned_agent = (select auth.uid())
        or current_owner  = (select auth.uid())
        or created_by     = (select auth.uid())
        or is_open = true
        or ( (select public.is_ops_admin()) and assigned_agent is null )
  ) )
);

-- INSERT — admins anything; an agent may add their own lead (stamped to them).
alter policy leads_insert on public.leads with check (
  (select public.is_admin())
  or ( created_by = (select auth.uid()) and assigned_agent = (select auth.uid()) )
);

-- UPDATE — admins anything; an agent may update a lead assigned to / owned by them.
alter policy leads_update on public.leads using (
  (select public.is_admin()) or assigned_agent = (select auth.uid()) or current_owner = (select auth.uid())
) with check (
  (select public.is_admin()) or assigned_agent = (select auth.uid()) or current_owner = (select auth.uid())
);

-- DELETE — master admin only.
alter policy leads_delete on public.leads using ( (select public.is_master()) );
