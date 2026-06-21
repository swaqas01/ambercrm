-- 35_perf_indexes_supplemental.sql
-- Supplemental composite indexes for the UNSCOPED (Master Admin / Admin) filtered + sorted lead
-- views, per-tab counts, and dashboard/Agent-Performance activity metrics.
--
-- ADDITIVE ONLY: creates indexes; reads/changes/deletes NO data; touches NO RLS or policy.
-- `if not exists` makes it safe to run once or re-run on production.
--
-- PREREQUISITE: migrations 15_perf_indexes.sql and 27_lead_indexes.sql (the base single-column +
-- agent-scoped composite lead indexes) should already be applied. This migration only adds the few
-- composites those did NOT cover — the ones that serve admin views filtering/sorting by a single
-- column across ALL agents (no agent scope), where the existing agent-scoped composites don't help.
--
-- LOCKING: at a few thousand rows each index builds in well under a second, so plain CREATE INDEX is
-- fine. If leads later grows very large and you want zero write-locking, re-issue any statement with
-- CREATE INDEX CONCURRENTLY (must run one-by-one, OUTSIDE a transaction — not inside BEGIN/COMMIT).

-- ---- leads: single-column filter + newest-first sort, across all agents (admin views & tab counts)
create index if not exists idx_leads_status_created       on public.leads (status, created_at desc);
create index if not exists idx_leads_temp_created         on public.leads (temperature, created_at desc);
create index if not exists idx_leads_source_created       on public.leads (source, created_at desc);
create index if not exists idx_leads_createdby_created    on public.leads (created_by, created_at desc);
create index if not exists idx_leads_assignedname_created on public.leads (assigned_agent_name, created_at desc);

-- ---- lead_activity: Agent Performance + dashboard metrics filter by actor within a period, by action
create index if not exists idx_activity_actor_created        on public.lead_activity (actor_id, created_at desc);
create index if not exists idx_activity_actor_action_created on public.lead_activity (actor_id, action, created_at desc);

-- ---- deals: approved-deal analytics filter by status and order by decided_at
create index if not exists idx_deals_status_decided on public.deals (status, decided_at desc);
