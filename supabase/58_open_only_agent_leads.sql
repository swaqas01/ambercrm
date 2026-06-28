-- 58_open_only_agent_leads.sql
-- Amber Homes CRM — auto-open applies ONLY to leads assigned to an AGENT.
-- Leads assigned to a Sales Manager (e.g. Ibrahim Qureshi) — or to any non-agent role
-- (admin, master_admin, marketing, accounts) — are NEVER opened automatically.
-- This is role-based, not name/id-based, so it keeps working if the manager changes.
--
-- auto_open_stale_leads is reproduced VERBATIM from migration 57 (which already excludes
-- manually-locked leads) with exactly ONE added selection clause:
--     and exists (select 1 from public.profiles p where p.id = l.assigned_agent and p.role::text = 'agent')
--
-- ADDITIVE & IDEMPOTENT. Changes no data. Safe to run once in the Supabase SQL editor. Run AFTER 57.

begin;

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
      and exists (select 1 from public.profiles p where p.id = l.assigned_agent and p.role::text = 'agent')
      and coalesce(l.locked, false) = false
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

revoke all on function public.auto_open_stale_leads() from public, anon;
grant execute on function public.auto_open_stale_leads() to authenticated, service_role;

commit;
