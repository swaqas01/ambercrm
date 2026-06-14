-- 20_lead_type_and_open_leads.sql
-- Adds Lead Type to leads, the Open Leads automation settings, and the smart 15-day auto-open function.
-- SAFE: additive only. No data deleted, no leads/users touched destructively. Re-runnable (IF NOT EXISTS,
-- create-or-replace, on-conflict-do-nothing). HOW TO RUN: Supabase -> SQL Editor -> paste -> Run.

-- ============================================================================
-- 1) LEAD TYPE
-- Existing leads default to 'Buyer' (these are predominantly buyer leads). Never overwrites real values.
-- ============================================================================
alter table public.leads add column if not exists lead_type text not null default 'Buyer';
create index if not exists leads_lead_type_idx on public.leads(lead_type);

-- ============================================================================
-- 2) OPEN LEADS SETTINGS (single-row config the Master Admin controls)
-- ============================================================================
create table if not exists public.open_leads_settings (
  id                        boolean primary key default true,
  auto_open_enabled         boolean not null default true,
  inactivity_days           integer not null default 15,
  apply_buyer               boolean not null default true,
  apply_seller              boolean not null default false,
  apply_tenant              boolean not null default false,
  apply_agent               boolean not null default false,
  respect_future_followups  boolean not null default true,
  view_counts_as_activity   boolean not null default false,
  notify_agent_before       boolean not null default false,
  notify_admin_after        boolean not null default true,
  exclude_statuses          text[]  not null default array['Closed Won','Closed Won Pending Approval','Closed Lost','Dead Lead'],
  updated_at                timestamptz not null default now(),
  updated_by                uuid references public.profiles(id),
  constraint open_leads_settings_singleton check (id = true)
);
insert into public.open_leads_settings (id) values (true) on conflict (id) do nothing;

alter table public.open_leads_settings enable row level security;
drop policy if exists ols_select on public.open_leads_settings;
create policy ols_select on public.open_leads_settings for select using (public.is_admin());
drop policy if exists ols_write  on public.open_leads_settings;
create policy ols_write  on public.open_leads_settings for all   using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 3) AUTO-OPEN FUNCTION — the smart 15-day rule
-- Opens a lead ONLY when ALL hold:
--   * lead_type is enabled in settings (Buyer only, by default)
--   * lead is currently assigned to an agent (includes agent-created leads)
--   * status is NOT an excluded status (Closed Won / Closed Won Pending Approval / Closed Lost / Dead Lead)
--   * lead is NOT tied to a deal in submitted / pending_review / approved
--   * no meaningful activity for >= inactivity_days (default 15)
--   * (respect_future_followups) no FUTURE follow-up — neither leads.next_followup nor a scheduled follow_ups row
-- On open it preserves the previous agent, clears the assignment, flags opened_auto, logs the timeline + reason.
-- SECURITY DEFINER so a scheduler (cron, service role) or a Master Admin can run it; agents are blocked.
-- ============================================================================
create or replace function public.auto_open_stale_leads()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  s            public.open_leads_settings;
  applicable   text[] := array[]::text[];
  cutoff       timestamptz;
  today_d      date := (now() at time zone 'Asia/Dubai')::date;
  r            record;
  last_act     timestamptz;
  opened_count integer := 0;
begin
  -- Only the system/scheduler (auth.uid() is null) or an admin may run this.
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Not authorized to run the open-leads automation.';
  end if;

  select * into s from public.open_leads_settings where id = true;
  if s is null or s.auto_open_enabled is not true then
    return 0;
  end if;

  if s.apply_buyer  then applicable := applicable || 'Buyer';  end if;
  if s.apply_seller then applicable := applicable || 'Seller'; end if;
  if s.apply_tenant then applicable := applicable || 'Tenant'; end if;
  if s.apply_agent  then applicable := applicable || 'Agent';  end if;
  if array_length(applicable, 1) is null then
    return 0;
  end if;

  cutoff := now() - make_interval(days => greatest(s.inactivity_days, 1));

  for r in
    select l.*
    from public.leads l
    where l.is_open = false
      and l.deleted = false
      and l.assigned_agent is not null
      and coalesce(l.lead_type, 'Buyer') = any(applicable)
      and coalesce(l.status, '') <> all(s.exclude_statuses)
      and not exists (
        select 1 from public.deals d
        where d.lead_id = l.id
          and coalesce(d.deleted, false) = false
          and d.status in ('submitted','pending_review','approved')
      )
  loop
    -- most recent MEANINGFUL activity from the audit trail
    select max(a.created_at) into last_act
    from public.lead_activity a
    where a.lead_id = r.id
      and (
        a.action in ('call','whatsapp','email','comment','note','followup_scheduled','followup_rescheduled',
                     'followup_completed','field_change','status_change','temperature_change','lead_edited',
                     'lead_created','lead_created_ai','reassign','make_open','make_open_bulk','lead_assigned',
                     'deal_submitted','deal','meeting','site_visit')
        or (s.view_counts_as_activity and a.action in ('view','view_number','reveal_phone'))
      );

    -- fold in last_contacted / assigned_at / created_at so the clock starts from assignment, not 1970
    last_act := greatest(
      coalesce(last_act, '-infinity'::timestamptz),
      coalesce(r.last_contacted::timestamptz, '-infinity'::timestamptz),
      coalesce(r.assigned_at, '-infinity'::timestamptz),
      coalesce(r.created_at, '-infinity'::timestamptz)
    );

    -- still active within the window -> leave it
    if last_act >= cutoff then
      continue;
    end if;

    -- planned future activity -> leave it (do NOT open)
    if s.respect_future_followups then
      if r.next_followup is not null and r.next_followup > today_d then
        continue;
      end if;
      if exists (
        select 1 from public.follow_ups f
        where f.lead_id = r.id and f.status = 'scheduled' and f.due_at > now()
      ) then
        continue;
      end if;
    end if;

    -- OPEN IT: preserve previous agent (uuid) into original_agent, clear assignment, flag auto.
    update public.leads
       set is_open = true,
           original_agent = coalesce(original_agent, r.assigned_agent),
           assigned_agent = null,
           current_owner  = null,
           assigned_agent_name = null,
           opened_reason  = s.inactivity_days || '-day inactivity (auto)',
           opened_by      = null,
           opened_at      = now(),
           opened_auto    = true,
           updated_at     = now()
     where id = r.id;

    insert into public.lead_activity (lead_id, actor_id, action, detail)
    values (r.id, null, 'make_open', jsonb_build_object(
      'auto', true,
      'reason', s.inactivity_days || ' days inactivity',
      'previous_agent', r.assigned_agent_name,
      'previous_agent_id', r.assigned_agent,
      'original_agent_id', coalesce(r.original_agent, r.assigned_agent),
      'created_by', r.created_by,
      'lead_type', coalesce(r.lead_type, 'Buyer'),
      'last_activity', case when last_act = '-infinity'::timestamptz then null else to_char(last_act, 'YYYY-MM-DD') end,
      'future_followup_checked', s.respect_future_followups
    ));

    opened_count := opened_count + 1;
  end loop;

  return opened_count;
end;
$$;

revoke all on function public.auto_open_stale_leads() from public;
grant execute on function public.auto_open_stale_leads() to authenticated, service_role;

-- ============================================================================
-- 4) SCHEDULING (optional) — run once a day. Enable pg_cron in Supabase first
--    (Dashboard -> Database -> Extensions -> pg_cron), then uncomment:
-- ----------------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- select cron.schedule('amber-auto-open-leads', '0 3 * * *', $cron$ select public.auto_open_stale_leads(); $cron$);
--
-- Alternatively call it from a daily Vercel Cron that hits an endpoint which runs
--   select public.auto_open_stale_leads();   (service role), or click "Run now" in the
-- Open Leads settings panel inside the CRM.
-- ============================================================================
