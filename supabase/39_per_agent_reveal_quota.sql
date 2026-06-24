-- 39_per_agent_reveal_quota.sql
-- Amber Homes — per-agent weekly contact-reveal quota (Master-Admin controlled).
--
-- WHAT EXISTS TODAY (migration 23): reveal_contact() enforces a GLOBAL weekly reveal quota
-- (open_leads_settings.reveal_quota_weekly, default 200) for every non-admin. This migration
-- makes that limit overridable PER AGENT, adds a "reset this week's usage" mechanism, and adds
-- two Master-Admin-only RPCs to read usage and set limits (single or bulk).
--
-- SAFE & IDEMPOTENT & BACKWARDS-COMPATIBLE:
--   * Adds two nullable columns to profiles. NULL override => behaviour is IDENTICAL to today.
--   * Re-defines reveal_contact() with the same logic, only swapping the global limit for
--     coalesce(per-agent override, global default) and measuring the week from an optional reset.
--   * Does NOT weaken RLS, does NOT change any policy, deletes nothing.
--   * Admins remain unlimited. Agents still can only reveal leads they're allowed to (unchanged).

-- =====================================================================
-- 1) Per-agent override columns (nullable: NULL = use the global default)
-- =====================================================================
alter table public.profiles add column if not exists reveal_quota_weekly_override integer;
alter table public.profiles add column if not exists reveal_quota_reset_at        timestamptz;

-- =====================================================================
-- 2) reveal_contact() — now per-agent aware (backwards-compatible)
-- =====================================================================
create or replace function public.reveal_contact(p_lead_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := public.is_admin();
  v_lead public.leads%rowtype;
  s public.open_leads_settings%rowtype;
  v_week int; v_10 int; v_hour int; v_day int;
  v_mine boolean;
  v_limit int;
  v_reset timestamptz;
  v_since timestamptz;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then return jsonb_build_object('error','not_found'); end if;

  v_mine := (v_lead.assigned_agent = v_uid or v_lead.current_owner = v_uid or v_lead.created_by = v_uid);
  -- May reveal: admins; the owner; or any agent for a lead currently in the open pool.
  if not (v_admin or v_mine or v_lead.is_open is true) then
    return jsonb_build_object('error','forbidden');
  end if;

  -- Admins are not quota-limited.
  if v_admin then
    insert into public.lead_activity(lead_id, actor_id, action, detail)
      values (p_lead_id, v_uid, 'reveal_phone', jsonb_build_object('by','admin'));
    return jsonb_build_object('phone', v_lead.phone, 'whatsapp', v_lead.whatsapp, 'email', v_lead.email, 'unlimited', true);
  end if;

  select * into s from public.open_leads_settings where id = true;

  -- Per-agent override (NULL => fall back to the global weekly quota), and the optional reset.
  select reveal_quota_weekly_override, reveal_quota_reset_at into v_limit, v_reset
    from public.profiles where id = v_uid;
  v_limit := coalesce(v_limit, s.reveal_quota_weekly, 200);
  -- greatest() ignores NULLs, so when no reset is set this is exactly "rolling 7 days".
  v_since := greatest(now() - interval '7 days', v_reset);

  -- Auto-pause: if enabled and the agent has an unresolved High/Critical alert in the last 24h.
  if coalesce(s.auto_pause_on_suspicion,false) and exists (
       select 1 from public.security_alerts a
       where a.agent_id = v_uid and a.status = 'open' and a.risk in ('High','Critical')
         and a.created_at > now() - interval '24 hours') then
    return jsonb_build_object('blocked', true, 'reason', 'paused');
  end if;

  select count(*) into v_week from public.lead_reveals where agent_id = v_uid and revealed_at > v_since;
  if v_week >= v_limit then
    if coalesce(s.notify_admin_on_quota,true) then
      insert into public.security_alerts(agent_id, kind, window_label, reveal_count, risk, detail)
        values (v_uid, 'quota_reached', 'rolling 7 days', v_week, 'Medium',
                jsonb_build_object('limit', v_limit));
    end if;
    return jsonb_build_object('blocked', true, 'reason', 'quota', 'used', v_week, 'limit', v_limit);
  end if;

  -- Record the reveal.
  insert into public.lead_reveals(agent_id, lead_id, context)
    values (v_uid, p_lead_id, case when v_lead.is_open then 'open' when v_mine then 'mine' else 'detail' end);
  if coalesce(s.reveal_counts_as_activity,true) then
    insert into public.lead_activity(lead_id, actor_id, action, detail)
      values (p_lead_id, v_uid, 'reveal_phone', jsonb_build_object('context', case when v_lead.is_open then 'open' else 'mine' end));
  end if;

  -- Rate-limit / theft detection on the rolling windows (alerts only; not a hard block).
  select count(*) into v_10  from public.lead_reveals where agent_id = v_uid and revealed_at > now() - make_interval(mins => coalesce(s.rapid_reveal_minutes,10));
  select count(*) into v_hour from public.lead_reveals where agent_id = v_uid and revealed_at > now() - interval '1 hour';
  select count(*) into v_day  from public.lead_reveals where agent_id = v_uid and revealed_at > now() - interval '1 day';

  if v_day >= coalesce(s.daily_reveal_limit,100) then
    insert into public.security_alerts(agent_id, kind, window_label, reveal_count, risk, detail)
      values (v_uid, 'daily', '1 day', v_day, 'Critical', jsonb_build_object('threshold', coalesce(s.daily_reveal_limit,100)));
  elsif v_hour >= coalesce(s.hourly_reveal_limit,50) then
    insert into public.security_alerts(agent_id, kind, window_label, reveal_count, risk, detail)
      values (v_uid, 'hourly', '1 hour', v_hour, 'High', jsonb_build_object('threshold', coalesce(s.hourly_reveal_limit,50)));
  elsif v_10 >= coalesce(s.rapid_reveal_count,20) then
    insert into public.security_alerts(agent_id, kind, window_label, reveal_count, risk, detail)
      values (v_uid, 'rapid_reveal', coalesce(s.rapid_reveal_minutes,10) || ' minutes', v_10, 'High', jsonb_build_object('threshold', coalesce(s.rapid_reveal_count,20)));
  end if;

  return jsonb_build_object('phone', v_lead.phone, 'whatsapp', v_lead.whatsapp, 'email', v_lead.email,
    'used', v_week + 1, 'limit', v_limit, 'remaining', v_limit - (v_week + 1),
    'warn', (v_limit - (v_week + 1)) <= 20);
end $$;
grant execute on function public.reveal_contact(uuid) to authenticated;

-- =====================================================================
-- 3) admin_reveal_usage() — Master-Admin only: per-agent limit + usage this week
-- =====================================================================
create or replace function public.admin_reveal_usage()
returns table (
  id uuid, full_name text, role text, active boolean,
  effective_limit int, is_custom boolean, used_week int, remaining int,
  reset_at timestamptz, last_reveal_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.full_name, p.role, p.active,
    coalesce(p.reveal_quota_weekly_override, s.reveal_quota_weekly, 200)::int as effective_limit,
    (p.reveal_quota_weekly_override is not null) as is_custom,
    (select count(*)::int from public.lead_reveals r
       where r.agent_id = p.id
         and r.revealed_at > greatest(now() - interval '7 days', p.reveal_quota_reset_at)) as used_week,
    greatest(0, coalesce(p.reveal_quota_weekly_override, s.reveal_quota_weekly, 200)::int
       - (select count(*)::int from public.lead_reveals r
            where r.agent_id = p.id
              and r.revealed_at > greatest(now() - interval '7 days', p.reveal_quota_reset_at))) as remaining,
    p.reveal_quota_reset_at as reset_at,
    (select max(r.revealed_at) from public.lead_reveals r where r.agent_id = p.id) as last_reveal_at
  from public.profiles p
  cross join lateral (select * from public.open_leads_settings where id = true) s
  where public.is_master()
    and p.role in ('agent','sales_manager','admin','master_admin')
  order by p.full_name;
$$;
grant execute on function public.admin_reveal_usage() to authenticated;

-- =====================================================================
-- 4) admin_set_reveal_quota() — Master-Admin only: set / clear / reset (single or bulk)
--    p_clear=true  -> remove override (use global default)
--    p_weekly set  -> set per-agent weekly limit
--    p_reset=true  -> reset this week's counted usage (audit log is preserved)
-- =====================================================================
create or replace function public.admin_set_reveal_quota(
  p_agent_ids uuid[],
  p_weekly    integer default null,
  p_clear     boolean default false,
  p_reset     boolean default false
)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_master() then return jsonb_build_object('error','forbidden'); end if;
  if p_agent_ids is null or array_length(p_agent_ids,1) is null then
    return jsonb_build_object('error','no_agents');
  end if;
  if p_weekly is not null and p_weekly < 0 then
    return jsonb_build_object('error','negative');
  end if;

  if p_clear then
    update public.profiles set reveal_quota_weekly_override = null where id = any(p_agent_ids);
  elsif p_weekly is not null then
    update public.profiles set reveal_quota_weekly_override = p_weekly where id = any(p_agent_ids);
  end if;

  if p_reset then
    update public.profiles set reveal_quota_reset_at = now() where id = any(p_agent_ids);
  end if;

  return jsonb_build_object('ok', true, 'updated', coalesce(array_length(p_agent_ids,1),0));
end $$;
grant execute on function public.admin_set_reveal_quota(uuid[], integer, boolean, boolean) to authenticated;
