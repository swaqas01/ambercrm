-- 68_leads_select_initplan_restore.sql
-- Amber Homes — PERFORMANCE FIX for slow Leads / Open Leads loading.
--
-- Root cause: migration 63 recreated the leads_select policy with BARE auth.uid() and role-function
-- calls, undoing the migration-45 optimisation. Bare calls are re-evaluated for EVERY row (each role
-- helper does a profiles lookup), so a single leads query performs thousands of hidden lookups.
-- Wrapped in a scalar sub-select, Postgres evaluates each ONCE per query (initplan).
--
-- THIS MIGRATION CHANGES NO ACCESS LOGIC. The USING expression below is byte-for-byte the live
-- migration-63 policy with only the (select ...) wrapping applied — verified by diff. Marketing's
-- full lead visibility, agent scoping, ops-admin unassigned view, open-pool visibility, master's
-- deleted-leads view: all identical. Uses ALTER POLICY (expression swap only; no drop/create).
--
--   live (63):  public.is_master()                      -> (select public.is_master())
--               public.is_lead_admin()                  -> (select public.is_lead_admin())
--               assigned_agent = auth.uid()             -> assigned_agent = (select auth.uid())
--               current_owner  = auth.uid()             -> current_owner  = (select auth.uid())
--               created_by     = auth.uid()             -> created_by     = (select auth.uid())
--               public.is_ops_admin()                   -> (select public.is_ops_admin())
--
-- Also wraps the one other bare call introduced recently: the data-calling settings read policy
-- from migration 62 (same treatment, same logic).
--
-- SAFE / IDEMPOTENT. ROLLBACK: re-run section 2 of migration 63 (restores the slow-but-identical body).

begin;

-- 1) leads_select — identical logic, initplan wrapping restored.
alter policy leads_select on public.leads using (
  (select public.is_master())
  or ( deleted = false and (
        (select public.is_lead_admin())
        or assigned_agent = (select auth.uid())
        or current_owner  = (select auth.uid())
        or created_by     = (select auth.uid())
        or is_open        = true
        or ( (select public.is_ops_admin()) and assigned_agent is null )
  ) )
);

-- 2) data_calling_project_settings read policy — same wrap, same logic.
alter policy dcps_read_all on public.data_calling_project_settings using (
  (select auth.uid()) is not null
);

commit;
