-- =====================================================================
-- Migration 59 — automate the daily open-leads sweep (pg_cron)
-- Logic unchanged from settings: Buyer-only, 15-day inactivity,
-- closed/locked/active-deal/scheduled-follow-up all exempt.
-- Runs every day at 03:00 Asia/Dubai (23:00 UTC). Bypass-safe for cron.
-- =====================================================================

-- 1) Ensure the scheduler exists (Supabase keeps pg_cron preloaded).
create extension if not exists pg_cron;

begin;

-- 2) Bypass-safe wrapper. The unattended job runs with auth.uid() = null,
--    so the leads anti-theft guard would block clearing assigned_agent and
--    the sweep would open ZERO. We set the same bypass the manual run uses,
--    scoped to this transaction only, then call the existing engine.
create or replace function public.cron_run_open_leads()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  n integer;
begin
  perform set_config('app.guard_bypass', 'on', true);  -- true = transaction-local
  select public.run_open_leads_daily() into n;
  return coalesce(n, 0);
end;
$fn$;

revoke execute on function public.cron_run_open_leads() from public, anon;
grant  execute on function public.cron_run_open_leads() to service_role;

-- 3) Register the daily job idempotently (safe to re-run).
do $unsched$
begin
  perform cron.unschedule('open-leads-daily');
exception when others then
  null;  -- not scheduled yet; ignore
end
$unsched$;

select cron.schedule(
  'open-leads-daily',
  '0 23 * * *',                                 -- 23:00 UTC = 03:00 Asia/Dubai, daily
  $job$ select public.cron_run_open_leads(); $job$
);

commit;

-- 4) Confirmation — THIS row is the result you'll see.
select
  (select count(*) from cron.job
     where jobname = 'open-leads-daily' and active)        as job_is_live,
  (select schedule from cron.job
     where jobname = 'open-leads-daily')                   as utc_schedule,
  (select count(*) from public.lead_activity
     where action = 'make_open' and (detail->>'auto') = 'true'
       and created_at >= now() - interval '24 hours')      as auto_opened_last_24h;
