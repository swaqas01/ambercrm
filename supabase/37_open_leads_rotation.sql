-- =====================================================================
-- Amber CRM — Migration 37: Open Leads DAILY ROTATION ("today's priority shuffle")
-- ADDITIVE ONLY. Does NOT alter the existing auto_open_stale_leads() function or any
-- live data. Builds: the rotation table (auditable), a few settings knobs, priority
-- columns on leads (so the Open Leads page can order by them cheaply), the daily
-- builder function, and a one-call daily job wrapper. Re-runnable.
-- HOW TO RUN: Supabase -> SQL Editor -> paste -> Run.
-- =====================================================================

-- 1) New settings knobs (Master-Admin controlled). Existing rows keep working unchanged.
alter table public.open_leads_settings add column if not exists shuffle_enabled       boolean not null default true;
alter table public.open_leads_settings add column if not exists daily_priority_count   integer not null default 500;
-- Phase-2 readiness (not wired into auto-open yet; harmless until then):
alter table public.open_leads_settings add column if not exists inactivity_hours       integer;            -- when set, overrides inactivity_days
alter table public.open_leads_settings add column if not exists include_weekends       boolean not null default true;

-- 2) Priority stamp + protection columns on leads (additive; default NULL/false = no change in behavior).
alter table public.leads add column if not exists open_priority_rank     integer;
alter table public.leads add column if not exists open_priority_reason   text;
alter table public.leads add column if not exists open_priority_date     date;
alter table public.leads add column if not exists protected_from_open_pool boolean not null default false;
create index if not exists leads_open_priority_idx on public.leads(open_priority_date, open_priority_rank) where is_open = true;
create index if not exists leads_protected_open_idx on public.leads(protected_from_open_pool) where protected_from_open_pool = true;

-- 3) Auditable daily rotation table.
create table if not exists public.open_lead_daily_rotation (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  rotation_date date not null default (now() at time zone 'Asia/Dubai')::date,
  priority_rank integer,
  reason        text,
  created_at    timestamptz not null default now(),
  unique (lead_id, rotation_date)
);
create index if not exists oldr_date_idx on public.open_lead_daily_rotation(rotation_date, priority_rank);
create index if not exists oldr_lead_idx on public.open_lead_daily_rotation(lead_id);
alter table public.open_lead_daily_rotation enable row level security;
drop policy if exists oldr_select on public.open_lead_daily_rotation;
create policy oldr_select on public.open_lead_daily_rotation for select using (public.is_admin());

-- 4) Run log (for "last run" stats in the admin panel later).
create table if not exists public.open_leads_run_log (
  id                   uuid primary key default gen_random_uuid(),
  run_at               timestamptz not null default now(),
  leads_moved_to_open  integer,
  leads_in_rotation    integer,
  duration_ms          integer,
  error                text
);
alter table public.open_leads_run_log enable row level security;
drop policy if exists olrl_select on public.open_leads_run_log;
create policy olrl_select on public.open_leads_run_log for select using (public.is_admin());

-- 5) Build today's rotation: pick up to N open leads, rank them, stamp them, write audit rows.
--    Priority order: (1) leads newly opened today (no-activity moves) -> (2) Hot temperature ->
--    (3) leads not shown in a previous rotation (stale) -> (4) fair random shuffle.
create or replace function public.build_open_lead_rotation()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  s        public.open_leads_settings;
  lim      integer;
  today_d  date := (now() at time zone 'Asia/Dubai')::date;
  cnt      integer := 0;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Not authorized to build the open-leads rotation.';
  end if;
  select * into s from public.open_leads_settings where id = true;
  if s is not null and s.shuffle_enabled is false then
    return 0;
  end if;
  lim := greatest(coalesce(s.daily_priority_count, 500), 1);

  -- idempotent: clear today's prior run (so re-running the job same-day rebuilds cleanly)
  delete from public.open_lead_daily_rotation where rotation_date = today_d;
  update public.leads set open_priority_rank = null, open_priority_reason = null, open_priority_date = null
    where open_priority_date = today_d;

  with cand as (
    select l.id, l.temperature,
           (l.opened_at at time zone 'Asia/Dubai')::date as opened_d,
           (select max(r.rotation_date) from public.open_lead_daily_rotation r where r.lead_id = l.id) as last_rot
    from public.leads l
    where l.is_open = true
      and l.deleted = false
      and coalesce(l.protected_from_open_pool, false) = false
      and coalesce(l.lead_type, 'Buyer') <> 'Agent'
  ),
  ranked as (
    select id,
      case when opened_d = today_d then 'no_activity_from_agent'
           when upper(coalesce(temperature,'')) = 'HOT' then 'high_potential'
           when last_rot is null then 'stale_open_lead'
           else 'daily_shuffle' end as reason,
      row_number() over (
        order by
          (case when opened_d = today_d then 0 else 1 end),
          (case upper(coalesce(temperature,'Cold')) when 'HOT' then 1 when 'WARM' then 2 else 3 end),
          last_rot asc nulls first,
          random()
      ) as rnk
    from cand
  )
  insert into public.open_lead_daily_rotation (lead_id, rotation_date, priority_rank, reason)
  select id, today_d, rnk, reason from ranked where rnk <= lim;

  get diagnostics cnt = row_count;

  update public.leads l
     set open_priority_rank   = r.priority_rank,
         open_priority_reason = r.reason,
         open_priority_date   = today_d
    from public.open_lead_daily_rotation r
   where r.rotation_date = today_d and r.lead_id = l.id;

  return cnt;
end; $$;
revoke all on function public.build_open_lead_rotation() from public;
grant execute on function public.build_open_lead_rotation() to authenticated, service_role;

-- 6) One-call daily job: run the EXISTING no-activity auto-open, then build today's rotation, then log.
create or replace function public.run_open_leads_daily()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t0      timestamptz := clock_timestamp();
  moved   integer := 0;
  rotated integer := 0;
  errtxt  text := null;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Not authorized to run the open-leads daily job.';
  end if;
  begin moved := public.auto_open_stale_leads();
  exception when others then errtxt := 'auto_open: ' || SQLERRM; end;
  begin rotated := public.build_open_lead_rotation();
  exception when others then errtxt := coalesce(errtxt || ' | ', '') || 'rotation: ' || SQLERRM; end;

  insert into public.open_leads_run_log (leads_moved_to_open, leads_in_rotation, duration_ms, error)
    values (moved, rotated, (extract(epoch from (clock_timestamp() - t0)) * 1000)::int, errtxt);

  return jsonb_build_object(
    'ran_at', now(),
    'leads_moved_to_open', moved,
    'leads_in_today_rotation', rotated,
    'duration_ms', (extract(epoch from (clock_timestamp() - t0)) * 1000)::int,
    'error', errtxt
  );
end; $$;
revoke all on function public.run_open_leads_daily() from public;
grant execute on function public.run_open_leads_daily() to authenticated, service_role;

-- 7) SCHEDULE (optional) — run daily 06:00 Asia/Dubai = 02:00 UTC. Enable pg_cron first
--    (Dashboard -> Database -> Extensions -> pg_cron), then run these two lines:
-- create extension if not exists pg_cron;
-- select cron.schedule('amber-open-leads-daily', '0 2 * * *', $cron$ select public.run_open_leads_daily(); $cron$);
-- =====================================================================
-- DONE.
-- =====================================================================
