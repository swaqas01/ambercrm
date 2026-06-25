-- 47_leads_search_trigram.sql
-- Amber Homes — make the leads SEARCH fast.
-- WHY: the leads search matches ilike across client_name, project, area, assigned_agent_name,
-- lead_code, status and email. Migration 40 only added trigram (ilike-capable) indexes on
-- client_name, project and normalized_phone. Because the search is one big OR, if ANY column in it
-- lacks a trigram index Postgres cannot combine index scans and falls back to a SEQUENTIAL SCAN of
-- every lead — that is why the search queries run 3.5s+. These columns have plain btree indexes,
-- which do NOT help `ilike '%term%'`. Adding trigram indexes on the remaining searched columns lets
-- Postgres bitmap-OR them and skip the full-table scan.
--
-- SAFE: additive. Build on ~7k rows is a few seconds; run during a quiet moment if you can. The only
-- trade-off is slightly slower lead writes (more indexes to maintain) — negligible at this volume.

create index if not exists idx_leads_area_trgm        on public.leads using gin (area gin_trgm_ops);
create index if not exists idx_leads_assignedname_trgm on public.leads using gin (assigned_agent_name gin_trgm_ops);
create index if not exists idx_leads_lead_code_trgm   on public.leads using gin (lead_code gin_trgm_ops);
create index if not exists idx_leads_status_trgm      on public.leads using gin (status gin_trgm_ops);
create index if not exists idx_leads_email_trgm       on public.leads using gin (email gin_trgm_ops);

analyze public.leads;
