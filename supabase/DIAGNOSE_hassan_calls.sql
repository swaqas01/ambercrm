-- DIAGNOSE_hassan_calls.sql
-- READ-ONLY. Changes nothing. Run in Supabase -> SQL Editor and paste the result back.
-- Goal: identify Hassan's exact user, then show every action type he generated, with TODAY's
-- count (Asia/Dubai) and the last 7 days, so we can compare DB reality vs the dashboard.

-- ============ QUERY 1 — identify Hassan (make sure it's the right person) ============
-- Run this first. If more than one row comes back, tell me which user_id is the real Hassan.
select id as user_id, full_name, email, role, active
from public.profiles
where full_name ilike '%hassan%' or email ilike '%hassan%'
order by full_name;


-- ============ QUERY 2 — Hassan's activity by action type (today Dubai + last 7 days) ============
-- This is the decisive one. It shows, for every Hassan match, each action he logged, how many
-- happened TODAY in Dubai time, how many in the last 7 days, and the last timestamp (Dubai).
with h as (
  select id, full_name, email
  from public.profiles
  where full_name ilike '%hassan%' or email ilike '%hassan%'
)
select
  h.full_name,
  h.email,
  la.action,
  count(*) filter (
    where (la.created_at at time zone 'Asia/Dubai')::date
        = (now() at time zone 'Asia/Dubai')::date
  ) as today_dubai,
  count(*) filter (where la.created_at > now() - interval '7 days') as last_7_days,
  to_char(max(la.created_at at time zone 'Asia/Dubai'), 'YYYY-MM-DD HH24:MI') as last_action_dubai
from h
left join public.lead_activity la on la.actor_id = h.id
group by h.full_name, h.email, la.action
order by h.full_name, today_dubai desc, last_7_days desc;


-- ============ QUERY 3 — raw call rows for Hassan today (timestamps + lead) ============
-- Lists each individual 'call' row logged today (Dubai), so we can see exact times and lead links,
-- and whether any are missing lead_id.
with h as (
  select id from public.profiles
  where full_name ilike '%hassan%' or email ilike '%hassan%'
)
select
  to_char(la.created_at at time zone 'Asia/Dubai', 'YYYY-MM-DD HH24:MI:SS') as dubai_time,
  la.action,
  la.lead_id,
  (la.lead_id is null) as missing_lead_id,
  la.detail
from public.lead_activity la
join h on la.actor_id = h.id
where la.action in ('call','call_click','phone_click','clicked_call','tel_click','contact_call','lead_call','call_started')
  and (la.created_at at time zone 'Asia/Dubai')::date = (now() at time zone 'Asia/Dubai')::date
order by la.created_at;
