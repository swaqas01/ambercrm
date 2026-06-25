-- 44_drop_duplicate_indexes.sql
-- Amber Homes — remove duplicate indexes flagged by the Performance Advisor.
-- SAFE: each pair below is two IDENTICAL indexes on the same column(s). We keep one and drop the
-- redundant copy. Duplicate indexes waste disk and slow every INSERT/UPDATE (both copies must be
-- maintained). Dropping the redundant one only helps. No data is affected.

drop index if exists public.follow_ups_lead_idx;       -- keep idx_followups_lead_id
drop index if exists public.hot_deals_status_idx;       -- keep idx_hotdeals_status
drop index if exists public.activity_actor_idx;         -- keep idx_activity_actor
drop index if exists public.activity_lead_idx;          -- keep idx_activity_lead
drop index if exists public.lead_comments_lead_idx;     -- keep idx_comments_lead
drop index if exists public.leads_assigned_idx;         -- keep idx_leads_assigned_agent
drop index if exists public.leads_lead_type_idx;        -- keep idx_leads_lead_type
drop index if exists public.leads_status_idx;           -- keep idx_leads_status
