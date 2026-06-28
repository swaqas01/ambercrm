-- 57_lead_manual_lock.sql
-- Amber Homes CRM — MANUAL lead lock with a reason.
-- The assigned agent (or an admin) marks an assigned lead as "actively closing — keep it
-- out of the Open Leads pool", choosing a reason. This is SEPARATE from closed_locked
-- (migration 56, the automatic lock when a deal is closed) and uses its own columns.
-- ADDITIVE & IDEMPOTENT. Deletes no data. Safe to run once in the Supabase SQL editor.
-- Run AFTER migration 56.

begin;

-- =========================================================================
-- 1) Lock columns (additive; default false/null = no change for existing rows).
-- =========================================================================
alter table public.leads add column if not exists locked      boolean not null default false;
alter table public.leads add column if not exists lock_reason text;
alter table public.leads add column if not exists locked_at   timestamptz;
alter table public.leads add column if not exists locked_by   uuid references public.profiles(id);
create index if not exists leads_locked_idx on public.leads(locked) where locked = true;

-- =========================================================================
-- 2) lock_lead(p_lead_id, p_reason)
--    Only the assigned agent / current owner, or an admin. Validates the reason,
--    sets the lock, and writes an audit row. SECURITY DEFINER so the controlled
--    checks here are the gate (the table's guard triggers are not tripped because
--    none of the protected columns — assignment/source/closed_locked/is_open — change).
-- =========================================================================
create or replace function public.lock_lead(p_lead_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_admin boolean := public.is_admin();
  v_lead  public.leads%rowtype;
  v_allow text[] := array['EOI in Process','Closed in the past','Final Stage of closing'];
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  if p_reason is null or not (p_reason = any(v_allow)) then
    return jsonb_build_object('error','bad_reason');
  end if;
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if not (v_admin or v_lead.assigned_agent = v_uid or v_lead.current_owner = v_uid) then
    return jsonb_build_object('error','forbidden');
  end if;
  if coalesce(v_lead.is_open, false) then
    return jsonb_build_object('error','is_open');   -- a lead in the open pool can't be locked
  end if;

  update public.leads
     set locked = true, lock_reason = p_reason, locked_at = now(), locked_by = v_uid, updated_at = now()
   where id = p_lead_id;

  insert into public.lead_activity (lead_id, actor_id, action, detail)
  values (p_lead_id, v_uid, 'lead_locked', jsonb_build_object('reason', p_reason));

  return jsonb_build_object('ok', true, 'reason', p_reason);
end $$;

-- =========================================================================
-- 3) unlock_lead(p_lead_id) — same authorization.
-- =========================================================================
create or replace function public.unlock_lead(p_lead_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_admin boolean := public.is_admin();
  v_lead  public.leads%rowtype;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if not (v_admin or v_lead.assigned_agent = v_uid or v_lead.current_owner = v_uid) then
    return jsonb_build_object('error','forbidden');
  end if;

  update public.leads
     set locked = false, lock_reason = null, locked_at = null, locked_by = null, updated_at = now()
   where id = p_lead_id;

  insert into public.lead_activity (lead_id, actor_id, action, detail)
  values (p_lead_id, v_uid, 'lead_unlocked', '{}'::jsonb);

  return jsonb_build_object('ok', true);
end $$;

-- =========================================================================
-- 4) Execute privileges: authenticated only (matches the migration 53 posture).
-- =========================================================================
revoke all on function public.lock_lead(uuid, text) from public, anon;
revoke all on function public.unlock_lead(uuid)     from public, anon;
grant execute on function public.lock_lead(uuid, text) to authenticated, service_role;
grant execute on function public.unlock_lead(uuid)     to authenticated, service_role;

-- =========================================================================
-- 5) Keep manually-locked leads OUT of the auto-open pool.
--    auto_open_stale_leads is defined only in migration 20; it is reproduced here
--    VERBATIM with exactly one added selection clause:
--        and coalesce(l.locked, false) = false
-- =========================================================================
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
