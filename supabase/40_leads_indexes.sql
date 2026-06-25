-- 40_leads_indexes.sql
-- Amber Homes — performance indexes for the leads list + search.
-- SAFE & ADDITIVE & IDEMPOTENT. Creates indexes only (IF NOT EXISTS). Deletes nothing, changes
-- no policy, no column. At the current table size each index builds in well under a second, so a
-- plain CREATE INDEX is fine (no CONCURRENTLY needed). Re-running this file is a no-op.
--
-- Why these: the list query is `... where <RLS scope> order by created_at desc limit 100`, and
-- search uses `ilike '%term%'` on name/phone/project. Btree indexes cover the sort + scope columns;
-- trigram (pg_trgm) GIN indexes make the ilike searches fast instead of scanning every row.

-- Trigram support for fast ILIKE '%...%' searches
create extension if not exists pg_trgm;

-- ---- Search (ILIKE) — the biggest search win ----
create index if not exists idx_leads_client_name_trgm on public.leads using gin (client_name gin_trgm_ops);
create index if not exists idx_leads_normphone_trgm   on public.leads using gin (normalized_phone gin_trgm_ops);
create index if not exists idx_leads_project_trgm     on public.leads using gin (project gin_trgm_ops);

-- ---- Default recency sort (and a version scoped to live, non-deleted leads) ----
create index if not exists idx_leads_created_at    on public.leads (created_at desc);
create index if not exists idx_leads_live_created  on public.leads (created_at desc) where deleted = false;

-- ---- RLS scope / common filters ----
create index if not exists idx_leads_assigned_agent on public.leads (assigned_agent) where deleted = false;
create index if not exists idx_leads_current_owner  on public.leads (current_owner)  where deleted = false;
create index if not exists idx_leads_created_by     on public.leads (created_by)     where deleted = false;
create index if not exists idx_leads_is_open        on public.leads (is_open)        where is_open = true;
create index if not exists idx_leads_status         on public.leads (status);
create index if not exists idx_leads_lead_type      on public.leads (lead_type);
create index if not exists idx_leads_next_followup  on public.leads (next_followup)  where next_followup is not null;

-- ---- Composite: an agent's own leads by recency (My Leads default) ----
create index if not exists idx_leads_agent_created  on public.leads (assigned_agent, created_at desc) where deleted = false;

-- Refresh planner stats so the new indexes are used immediately.
analyze public.leads;
