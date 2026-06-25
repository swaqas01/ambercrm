-- DIAGNOSE_admin_dashboard.sql
-- Run in Supabase → SQL Editor AFTER applying 42_admin_dashboard_stats.sql.
-- These are the ground-truth active-lead counts the master dashboard should show. Compare them to the
-- dashboard tiles in the app (logged in as Master Admin). They should match.
--
-- NOTE: do NOT verify by calling admin_dashboard_stats() directly in the SQL Editor — the editor runs
-- without a logged-in user (no auth.uid()), so the function's "master sees everything" branch won't
-- apply there. Verify against the APP instead, using these reference numbers.

select
  count(*)                                                                              as total_active_leads,
  count(*) filter (where is_open)                                                       as open_pool,
  count(*) filter (where temperature = 'Hot')                                           as hot,
  count(*) filter (where temperature = 'Very Hot')                                      as very_hot,
  count(*) filter (where status = 'Closed Won')                                         as won_total,
  count(*) filter (where (created_at at time zone 'Asia/Dubai')::date
                         = (now() at time zone 'Asia/Dubai')::date)                     as new_today,
  count(*) filter (where date_trunc('month', (created_at at time zone 'Asia/Dubai')::timestamp)
                         = date_trunc('month', (now() at time zone 'Asia/Dubai')::timestamp)) as new_this_month
from public.leads
where deleted is not true;
