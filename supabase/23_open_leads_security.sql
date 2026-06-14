-- 23_open_leads_security.sql
-- Amber Homes — Open Leads security + anti-data-theft foundation (DB-ENFORCED).
-- SAFE & IDEMPOTENT: adds settings columns, two tables, and a set of SECURITY DEFINER RPCs.
-- Deletes nothing. Does not weaken Master Admin. Run in Supabase -> SQL Editor.
--
-- WHY RPCs: agents must be able to (a) reveal an Open Lead's contact they do NOT own, (b) release
-- their own lead to the open pool, and (c) take one open lead — all of which touch columns that the
-- protected-columns guard (migration 12) blocks for non-admins. These RPCs run as definer (bypassing
-- RLS) and set a transaction-local guard-bypass GUC so ONLY these controlled operations are allowed;
-- direct agent writes to those columns remain blocked. Quota + rate limits are enforced here, in the
-- database, so they cannot be bypassed from the client or the API.

-- =====================================================================
-- 1) SECURITY SETTINGS (extend the existing Open Leads settings singleton)
-- =====================================================================
alter table public.open_leads_settings add column if not exists reveal_quota_weekly        integer not null default 200;
alter table public.open_leads_settings add column if not exists rapid_reveal_count          integer not null default 20;
alter table public.open_leads_settings add column if not exists rapid_reveal_minutes        integer not null default 10;
alter table public.open_leads_settings add column if not exists hourly_reveal_limit         integer not null default 50;
alter table public.open_leads_settings add column if not exists daily_reveal_limit          integer not null default 100;
alter table public.open_leads_settings add column if not exists auto_pause_on_suspicion     boolean not null default false;
alter table public.open_leads_settings add column if not exists agents_can_mark_open        boolean not null default true;
alter table public.open_leads_settings add column if not exists agents_can_self_assign_open boolean not null default true;
alter table public.open_leads_settings add column if not exists reveal_counts_as_activity   boolean not null default true;
alter table public.open_leads_settings add column if not exists notify_admin_on_quota       boolean not null default true;
alter table public.open_leads_settings add column if not exists notify_admin_on_suspicion   boolean not null default true;
alter table public.open_leads_settings add column if not exists block_agent_bulk            boolean not null default true;

-- =====================================================================
-- 2) REVEAL LOG  (one row per contact reveal — the basis for quota + theft detection)
-- =====================================================================
create table if not exists public.lead_reveals (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.profiles(id),
  lead_id     uuid references public.leads(id) on delete set null,
  context     text,                       -- 'open' | 'mine' | 'detail'
  revealed_at timestamptz not null default now()
);
create index if not exists lead_reveals_agent_time_idx on public.lead_reveals (agent_id, revealed_at desc);
create index if not exists lead_reveals_lead_idx on public.lead_reveals (lead_id);
alter table public.lead_reveals enable row level security;
drop policy if exists lr_select_own on public.lead_reveals;
create policy lr_select_own on public.lead_reveals for select using (agent_id = auth.uid() or public.is_admin());
drop policy if exists lr_insert_own on public.lead_reveals;
create policy lr_insert_own on public.lead_reveals for insert with check (agent_id = auth.uid());

-- =====================================================================
-- 3) SECURITY ALERTS  (suspicious reveal patterns / quota events for the admin Security Watch)
-- =====================================================================
create table if not exists public.security_alerts (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid references public.profiles(id),
  kind         text not null,             -- 'rapid_reveal' | 'hourly' | 'daily' | 'quota_reached' | 'reveal_no_action'
  window_label text,
  reveal_count integer,
  risk         text not null default 'Low',   -- Low | Medium | High | Critical
  detail       jsonb,
  status       text not null default 'open',  -- open | reviewed | dismissed
  created_at   timestamptz not null default now()
);
create index if not exists security_alerts_agent_idx on public.security_alerts (agent_id, created_at desc);
create index if not exists security_alerts_status_idx on public.security_alerts (status, created_at desc);
alter table public.security_alerts enable row level security;
drop policy if exists sa_admin_select on public.security_alerts;
create policy sa_admin_select on public.security_alerts for select using (public.is_admin());
drop policy if exists sa_admin_update on public.security_alerts;
create policy sa_admin_update on public.security_alerts for update using (public.is_admin()) with check (public.is_admin());
-- inserts happen only inside the SECURITY DEFINER RPCs below (no insert policy = no direct client inserts).

-- =====================================================================
-- 4) GUARD-BYPASS hook on the protected-columns trigger.
--    The guard still blocks every ordinary non-admin write to protected columns; it yields ONLY when
--    one of our controlled RPCs has set the transaction-local flag below.
-- =====================================================================
create or replace function public.guard_protected_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.guard_bypass', true), '') = 'on' then
    return new;                           -- controlled RPC (mark_lead_open / assign_open_lead)
  end if;
  if not public.is_admin() then
    if new.assigned_agent  is distinct from old.assigned_agent
       or new.current_owner   is distinct from old.current_owner
       or new.original_agent  is distinct from old.original_agent
       or new.created_by      is distinct from old.created_by
       or new.source          is distinct from old.source
       or new.deleted         is distinct from old.deleted
       or new.client_name     is distinct from old.client_name
       or new.phone           is distinct from old.phone
       or new.whatsapp        is distinct from old.whatsapp
       or new.email           is distinct from old.email then
      raise exception 'Not allowed: protected fields can only be changed by an admin';
    end if;
  end if;
  return new;
end $$;

-- =====================================================================
-- 5) REVEAL CONTACT  — quota + rate-limit enforced reveal. Returns contact or a block.
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

  -- Auto-pause: if enabled and the agent has an unresolved High/Critical alert in the last 24h.
  if coalesce(s.auto_pause_on_suspicion,false) and exists (
       select 1 from public.security_alerts a
       where a.agent_id = v_uid and a.status = 'open' and a.risk in ('High','Critical')
         and a.created_at > now() - interval '24 hours') then
    return jsonb_build_object('blocked', true, 'reason', 'paused');
  end if;

  select count(*) into v_week from public.lead_reveals where agent_id = v_uid and revealed_at > now() - interval '7 days';
  if v_week >= coalesce(s.reveal_quota_weekly,200) then
    if coalesce(s.notify_admin_on_quota,true) then
      insert into public.security_alerts(agent_id, kind, window_label, reveal_count, risk, detail)
        values (v_uid, 'quota_reached', 'rolling 7 days', v_week, 'Medium',
                jsonb_build_object('limit', coalesce(s.reveal_quota_weekly,200)));
    end if;
    return jsonb_build_object('blocked', true, 'reason', 'quota', 'used', v_week, 'limit', coalesce(s.reveal_quota_weekly,200));
  end if;

  -- Record the reveal.
  insert into public.lead_reveals(agent_id, lead_id, context)
    values (v_uid, p_lead_id, case when v_lead.is_open then 'open' when v_mine then 'mine' else 'detail' end);
  if coalesce(s.reveal_counts_as_activity,true) then
    insert into public.lead_activity(lead_id, actor_id, action, detail)
      values (p_lead_id, v_uid, 'reveal_phone', jsonb_build_object('context', case when v_lead.is_open then 'open' else 'mine' end));
  end if;

  -- Rate-limit / theft detection on the rolling windows.
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
    'used', v_week + 1, 'limit', coalesce(s.reveal_quota_weekly,200), 'remaining', coalesce(s.reveal_quota_weekly,200) - (v_week + 1),
    'warn', (coalesce(s.reveal_quota_weekly,200) - (v_week + 1)) <= 20);
end $$;
grant execute on function public.reveal_contact(uuid) to authenticated;

-- =====================================================================
-- 6) MARK LEAD OPEN  — agent releases their OWN lead into the open pool (with reason + history).
-- =====================================================================
create or replace function public.mark_lead_open(p_lead_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := public.is_admin();
  v_lead public.leads%rowtype;
  s public.open_leads_settings%rowtype;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if not (v_admin or v_lead.assigned_agent = v_uid or v_lead.current_owner = v_uid or v_lead.created_by = v_uid) then
    return jsonb_build_object('error','forbidden');
  end if;
  if v_lead.is_open is true then return jsonb_build_object('error','already_open'); end if;

  select * into s from public.open_leads_settings where id = true;
  if not v_admin and not coalesce(s.agents_can_mark_open,true) then
    return jsonb_build_object('error','disabled');
  end if;
  if v_lead.status = any (coalesce(s.exclude_statuses, array['Closed Won','Closed Won Pending Approval','Closed Lost','Dead Lead'])) then
    return jsonb_build_object('error','locked_status');
  end if;

  perform set_config('app.guard_bypass','on', true);
  update public.leads set
    is_open = true,
    original_agent = coalesce(original_agent, assigned_agent, current_owner),
    assigned_agent = null,
    current_owner = null,
    assigned_agent_name = null,
    opened_reason = nullif(trim(coalesce(p_reason,'')),''),
    opened_by = v_uid,
    opened_at = now(),
    opened_auto = false
  where id = p_lead_id;

  insert into public.lead_activity(lead_id, actor_id, action, detail)
    values (p_lead_id, v_uid, 'make_open', jsonb_build_object('reason', p_reason, 'released_by', v_uid));
  begin
    insert into public.lead_ownership_history(lead_id, from_agent, to_agent, reason, changed_by)
      values (p_lead_id, v_lead.assigned_agent, null, p_reason, v_uid);
  exception when others then null; end;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.mark_lead_open(uuid, text) to authenticated;

-- =====================================================================
-- 7) ASSIGN OPEN LEAD  — agent takes ONE lead from the open pool (one call = one lead).
-- =====================================================================
create or replace function public.assign_open_lead(p_lead_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := public.is_admin();
  v_lead public.leads%rowtype;
  s public.open_leads_settings%rowtype;
  v_name text;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if v_lead.is_open is not true then return jsonb_build_object('error','not_open'); end if;

  select * into s from public.open_leads_settings where id = true;
  if not v_admin and not coalesce(s.agents_can_self_assign_open,true) then
    return jsonb_build_object('error','disabled');
  end if;
  -- Respect auto-pause for agents under an active High/Critical alert.
  if not v_admin and coalesce(s.auto_pause_on_suspicion,false) and exists (
       select 1 from public.security_alerts a
       where a.agent_id = v_uid and a.status = 'open' and a.risk in ('High','Critical')
         and a.created_at > now() - interval '24 hours') then
    return jsonb_build_object('error','paused');
  end if;

  select full_name into v_name from public.profiles where id = v_uid;
  perform set_config('app.guard_bypass','on', true);
  update public.leads set
    is_open = false,
    assigned_agent = v_uid,
    current_owner = v_uid,
    assigned_agent_name = v_name,
    original_agent = coalesce(original_agent, v_uid),
    assigned_at = now(),
    opened_reason = null, opened_by = null, opened_at = null, opened_auto = false
  where id = p_lead_id;

  insert into public.lead_activity(lead_id, actor_id, action, detail)
    values (p_lead_id, v_uid, 'assign_self', jsonb_build_object('from','Open Leads'));
  begin
    insert into public.lead_ownership_history(lead_id, from_agent, to_agent, reason, changed_by)
      values (p_lead_id, null, v_uid, 'Assigned from Open Leads', v_uid);
  exception when others then null; end;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.assign_open_lead(uuid) to authenticated;

-- =====================================================================
-- 8) ADMIN SECURITY OVERVIEW  — reveal counts + reveal-to-action per agent (for Security Watch / Ask Amber).
-- =====================================================================
create or replace function public.security_overview(p_days integer default 7)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rows jsonb; v_alerts jsonb;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_rows from (
    select p.id as agent_id, p.full_name,
      (select count(*) from public.lead_reveals r where r.agent_id = p.id and r.revealed_at > now() - make_interval(days => p_days)) as reveals,
      (select count(*) from public.lead_activity a where a.actor_id = p.id and a.action in ('call_click','call') and a.created_at > now() - make_interval(days => p_days)) as calls,
      (select count(*) from public.lead_activity a where a.actor_id = p.id and a.action in ('whatsapp_click','whatsapp') and a.created_at > now() - make_interval(days => p_days)) as whatsapps,
      (select count(*) from public.lead_activity a where a.actor_id = p.id and a.action = 'assign_self' and a.created_at > now() - make_interval(days => p_days)) as assignments
    from public.profiles p where p.role = 'agent'
  ) t;
  select coalesce(jsonb_agg(row_to_json(a) order by a.created_at desc), '[]'::jsonb) into v_alerts
    from public.security_alerts a where a.status = 'open' and a.created_at > now() - make_interval(days => p_days);
  return jsonb_build_object('agents', v_rows, 'alerts', v_alerts, 'days', p_days);
end $$;
grant execute on function public.security_overview(integer) to authenticated;

-- =====================================================================
-- DONE. Agent hard-delete protection is already enforced (guard_protected_columns blocks any
-- non-admin change to leads.deleted; agents have no delete UI). Bulk Open Leads actions are blocked
-- for agents in the app, and self-assign is one-lead-per-call by construction.
-- =====================================================================
