-- 27_lead_indexes.sql
-- Performance indexes for SERVER-SIDE leads pagination / filtering / sorting / counts.
-- Purely additive: creates indexes only. No data is read, changed, or deleted; no RLS or policy
-- is touched. Safe to run once on production. `if not exists` makes it safe to re-run.
--
-- Column names below are the REAL columns on public.leads (assigned_agent, next_followup, area,
-- is_open, current_owner) — not the placeholder names from the spec.
--
-- NOTE on locking: at a few thousand rows each index builds in well under a second, so a plain
-- CREATE INDEX is fine. If the table later grows very large and you want zero write-locking, run
-- each statement with CREATE INDEX CONCURRENTLY instead (must be run one-by-one, outside a
-- transaction — i.e. not inside a BEGIN/COMMIT block).

-- ---- single-column indexes (sorting + filtering) ----
create index if not exists idx_leads_created_at        on public.leads (created_at desc);
create index if not exists idx_leads_assigned_agent    on public.leads (assigned_agent);
create index if not exists idx_leads_current_owner     on public.leads (current_owner);
create index if not exists idx_leads_created_by        on public.leads (created_by);
create index if not exists idx_leads_status            on public.leads (status);
create index if not exists idx_leads_temperature       on public.leads (temperature);
create index if not exists idx_leads_project           on public.leads (project);
create index if not exists idx_leads_area              on public.leads (area);
create index if not exists idx_leads_source            on public.leads (source);
create index if not exists idx_leads_next_followup     on public.leads (next_followup);
create index if not exists idx_leads_is_open           on public.leads (is_open);
create index if not exists idx_leads_assigned_name     on public.leads (assigned_agent_name);

-- ---- composite indexes (agent-scoped + sorted, the hot path for "My Leads" and tabs) ----
create index if not exists idx_leads_agent_created     on public.leads (assigned_agent, created_at desc);
create index if not exists idx_leads_agent_temp_created on public.leads (assigned_agent, temperature, created_at desc);
create index if not exists idx_leads_agent_status_created on public.leads (assigned_agent, status, created_at desc);
create index if not exists idx_leads_followup_agent    on public.leads (next_followup, assigned_agent);
create index if not exists idx_leads_project_created   on public.leads (project, created_at desc);
create index if not exists idx_leads_area_created      on public.leads (area, created_at desc);

-- ---- partial indexes (assignment + open-pool views the admins use constantly) ----
-- Unassigned queue (Lead Assignment screen): assigned_agent IS NULL AND is_open = false.
create index if not exists idx_leads_unassigned        on public.leads (created_at desc) where assigned_agent is null and is_open = false;
-- Open pool (Open Leads): is_open = true.
create index if not exists idx_leads_open_pool         on public.leads (created_at desc) where is_open = true;

-- ---- OPTIONAL (not created here) ----
-- Fast substring search (ILIKE '%term%') on a large table benefits from pg_trgm GIN indexes.
-- Search today is already bounded by scope + a 100-row page, so this is optional. To enable:
--   create extension if not exists pg_trgm;
--   create index if not exists idx_leads_name_trgm on public.leads using gin (client_name gin_trgm_ops);
--   create index if not exists idx_leads_project_trgm on public.leads using gin (project gin_trgm_ops);
