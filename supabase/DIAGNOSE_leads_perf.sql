-- DIAGNOSE_leads_perf.sql
-- READ-ONLY. Changes nothing. Run in Supabase -> SQL Editor (one query at a time) and paste back.
-- Helps confirm what's actually slow before/after applying 40_leads_indexes.sql.

-- ============ QUERY 1 — what indexes already exist on leads ============
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'leads'
order by indexname;

-- ============ QUERY 2 — table size / row count ============
select
  (select count(*) from public.leads) as total_rows,
  (select count(*) from public.leads where deleted = false) as live_rows,
  pg_size_pretty(pg_total_relation_size('public.leads')) as total_size;

-- ============ QUERY 3 — does the default list query use an index or scan? (run AFTER migration 40 too) ============
explain (analyze, buffers)
select id, lead_code, client_name, phone, project, status, temperature, created_at
from public.leads
where deleted = false
order by created_at desc
limit 100;

-- ============ QUERY 4 — does a name search use the trigram index? (run AFTER migration 40) ============
explain (analyze, buffers)
select id, client_name, phone, project
from public.leads
where deleted = false and client_name ilike '%kevin%'
limit 100;
