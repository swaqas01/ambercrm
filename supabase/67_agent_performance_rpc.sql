-- 67_agent_performance_rpc.sql
-- Amber Homes — Agent Performance rebuilt for speed.
--
-- WHY IT WAS SLOW: the page downloaded raw lead_activity rows since the period start (paged, up to
-- 80 sequential 1000-row requests) plus profiles/devices/targets/deals, then aggregated in the browser.
-- For Month/Quarter/Year that is tens of thousands of rows shipped to the phone before a single number
-- appears. Fix: aggregate in Postgres. One summary RPC for the page, one detail RPC per agent drawer.
--
-- Functions:
--   can_view_performance()                    master_admin / admin / sales_manager
--   agent_performance_report(p_from,p_to)     per-agent aggregates for the range (jsonb)
--   agent_performance_detail(p_agent,...)     recent logs for ONE agent (activity, comments,
--                                             follow-ups, deals) — loaded only on drawer open
-- Commission figures are included only for master_admin (null for other viewers).
-- "Leads received" uses the ORIGINAL assignment (earliest lead_ownership_history.to_agent, falling back
-- to original_agent / assigned_agent) and the time of that first assignment — matching the Marketing rule.
--
-- Indexes: composites for the per-agent range scans used here (all IF NOT EXISTS, additive).
-- SAFE / IDEMPOTENT / read-only. ROLLBACK: drop the three functions; indexes can stay.

begin;

-- ---------------------------------------------------------------- indexes
create index if not exists idx_comments_author_created  on public.lead_comments (author_id, created_at desc);
create index if not exists idx_followups_completedby    on public.follow_ups (completed_by, completed_at desc);
create index if not exists idx_followups_agent_due      on public.follow_ups (agent_id, due_at) where status = 'scheduled';
create index if not exists idx_deals_agent_submitted    on public.deals (agent_id, submitted_at desc);
create index if not exists idx_deals_agent_decided      on public.deals (agent_id, decided_at desc);
create index if not exists idx_leads_agent_assignedat   on public.leads (assigned_agent, assigned_at desc);
create index if not exists idx_ownership_lead_created   on public.lead_ownership_history (lead_id, created_at);
create index if not exists idx_ownership_toagent_created on public.lead_ownership_history (to_agent, created_at);

-- ---------------------------------------------------------------- role gate
create or replace function public.can_view_performance()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('master_admin','admin','sales_manager')
                   from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.can_view_performance() from public, anon;
grant  execute on function public.can_view_performance() to authenticated;

-- ---------------------------------------------------------------- summary report
create or replace function public.agent_performance_report(
  p_from timestamptz,
  p_to   timestamptz
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_master boolean;
begin
  if not public.can_view_performance() then
    return jsonb_build_object('error', 'forbidden');
  end if;
  v_master := public.is_master();

  return (
    with staff as (
      select pr.id, pr.full_name, pr.role, pr.active, pr.avatar_url, pr.last_login
      from public.profiles pr
      where pr.role in ('agent','sales_manager','admin','master_admin')
    ),
    act as (
      select a.actor_id,
             count(*) filter (where a.action = 'call')                                   as calls,
             count(*) filter (where a.action = 'whatsapp')                               as whatsapps,
             count(*) filter (where a.action in ('view_number','reveal_phone'))          as reveals,
             count(distinct (a.created_at at time zone 'Asia/Dubai')::date)              as active_days,
             max(a.created_at)                                                           as last_act
      from public.lead_activity a
      where a.created_at >= p_from and a.created_at < p_to
      group by a.actor_id
    ),
    com as (
      select c.author_id, count(*) as comments
      from public.lead_comments c
      where c.deleted = false and c.created_at >= p_from and c.created_at < p_to
      group by c.author_id
    ),
    fu_done as (
      select coalesce(f.completed_by, f.agent_id) as agent, count(*) as fu_completed
      from public.follow_ups f
      where f.status = 'completed' and f.completed_at >= p_from and f.completed_at < p_to
      group by coalesce(f.completed_by, f.agent_id)
    ),
    fu_pend as (
      select f.agent_id as agent, count(*) as fu_pending
      from public.follow_ups f
      where f.status = 'scheduled' and f.due_at >= p_from and f.due_at < p_to
      group by f.agent_id
    ),
    la as (
      select l.assigned_agent as agent, count(*) as leads_assigned
      from public.leads l
      where l.deleted = false and l.assigned_agent is not null
        and l.assigned_at >= p_from and l.assigned_at < p_to
      group by l.assigned_agent
    ),
    firsts as (
      select coalesce(h.to_agent, l.original_agent, l.assigned_agent) as agent,
             coalesce(h.created_at, l.assigned_at, l.created_at)      as first_at
      from public.leads l
      left join lateral (
        select h0.to_agent, h0.created_at
        from public.lead_ownership_history h0
        where h0.lead_id = l.id and h0.to_agent is not null
        order by h0.created_at asc limit 1
      ) h on true
      where l.deleted = false
    ),
    orig as (
      select fs.agent, count(*) as leads_received
      from firsts fs
      where fs.agent is not null and fs.first_at >= p_from and fs.first_at < p_to
      group by fs.agent
    ),
    ds as (
      select d.agent_id as agent, count(*) as deals_submitted
      from public.deals d
      where d.deleted = false and d.status <> 'draft'
        and coalesce(d.submitted_at, d.created_at) >= p_from
        and coalesce(d.submitted_at, d.created_at) <  p_to
      group by d.agent_id
    ),
    dc as (
      select d.agent_id as agent, count(*) as deals_closed,
             sum(coalesce(d.company_share, d.final_net, d.net_commission, 0)) as commission
      from public.deals d
      where d.deleted = false and d.status = 'approved'
        and d.decided_at >= p_from and d.decided_at < p_to
      group by d.agent_id
    )
    select jsonb_build_object(
      'is_master', v_master,
      'agents', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id',              s.id,
          'full_name',       s.full_name,
          'role',            s.role,
          'active',          s.active,
          'avatar_url',      s.avatar_url,
          'last_login',      s.last_login,
          'last_act',        act.last_act,
          'active_days',     coalesce(act.active_days, 0),
          'leads_received',  coalesce(orig.leads_received, 0),
          'leads_assigned',  coalesce(la.leads_assigned, 0),
          'calls',           coalesce(act.calls, 0),
          'whatsapps',       coalesce(act.whatsapps, 0),
          'reveals',         coalesce(act.reveals, 0),
          'comments',        coalesce(com.comments, 0),
          'fu_completed',    coalesce(fu_done.fu_completed, 0),
          'fu_pending',      coalesce(fu_pend.fu_pending, 0),
          'deals_submitted', coalesce(ds.deals_submitted, 0),
          'deals_closed',    coalesce(dc.deals_closed, 0),
          'commission',      case when v_master then coalesce(dc.commission, 0) else null end
        ))
        from staff s
        left join act     on act.actor_id = s.id
        left join com     on com.author_id = s.id
        left join fu_done on fu_done.agent = s.id
        left join fu_pend on fu_pend.agent = s.id
        left join la      on la.agent = s.id
        left join orig    on orig.agent = s.id
        left join ds      on ds.agent = s.id
        left join dc      on dc.agent = s.id
      ), '[]'::jsonb)
    )
  );
end $$;
revoke all on function public.agent_performance_report(timestamptz, timestamptz) from public, anon;
grant  execute on function public.agent_performance_report(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------- per-agent detail (drawer)
create or replace function public.agent_performance_detail(
  p_agent uuid,
  p_from  timestamptz,
  p_to    timestamptz
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_master boolean;
begin
  if not public.can_view_performance() then
    return jsonb_build_object('error', 'forbidden');
  end if;
  v_master := public.is_master();

  return jsonb_build_object(
    'activity', coalesce((
      select jsonb_agg(jsonb_build_object(
               'action', x.action, 'created_at', x.created_at,
               'lead_id', x.lead_id, 'lead_name', x.client_name))
      from (
        select a.action, a.created_at, a.lead_id, l.client_name
        from public.lead_activity a
        left join public.leads l on l.id = a.lead_id
        where a.actor_id = p_agent
          and a.action in ('call','whatsapp','view_number','reveal_phone')
          and a.created_at >= p_from and a.created_at < p_to
        order by a.created_at desc limit 200
      ) x
    ), '[]'::jsonb),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
               'body', x.body, 'created_at', x.created_at,
               'lead_id', x.lead_id, 'lead_name', x.client_name))
      from (
        select left(c.body, 220) as body, c.created_at, c.lead_id, l.client_name
        from public.lead_comments c
        left join public.leads l on l.id = c.lead_id
        where c.author_id = p_agent and c.deleted = false
          and c.created_at >= p_from and c.created_at < p_to
        order by c.created_at desc limit 100
      ) x
    ), '[]'::jsonb),
    'followups', coalesce((
      select jsonb_agg(jsonb_build_object(
               'type', x.type, 'status', x.status, 'due_at', x.due_at,
               'completed_at', x.completed_at, 'lead_id', x.lead_id, 'lead_name', x.client_name))
      from (
        select f.type, f.status, f.due_at, f.completed_at, f.lead_id, l.client_name
        from public.follow_ups f
        left join public.leads l on l.id = f.lead_id
        where (f.agent_id = p_agent or f.completed_by = p_agent)
          and ( (f.due_at >= p_from and f.due_at < p_to)
             or (f.completed_at >= p_from and f.completed_at < p_to) )
        order by f.due_at desc limit 100
      ) x
    ), '[]'::jsonb),
    'deals', coalesce((
      select jsonb_agg(jsonb_build_object(
               'deal_no', x.deal_no, 'status', x.status, 'client_name', x.client_name,
               'project', x.project, 'property_value', x.property_value,
               'created_at', x.created_at, 'decided_at', x.decided_at,
               'commission', case when v_master then x.comm else null end))
      from (
        select d.deal_no, d.status, d.client_name, d.project, d.property_value,
               d.created_at, d.decided_at,
               coalesce(d.company_share, d.final_net, d.net_commission, 0) as comm
        from public.deals d
        where d.deleted = false and d.agent_id = p_agent
          and ( (coalesce(d.submitted_at, d.created_at) >= p_from and coalesce(d.submitted_at, d.created_at) < p_to)
             or (d.decided_at >= p_from and d.decided_at < p_to) )
        order by d.created_at desc limit 50
      ) x
    ), '[]'::jsonb)
  );
end $$;
revoke all on function public.agent_performance_detail(uuid, timestamptz, timestamptz) from public, anon;
grant  execute on function public.agent_performance_detail(uuid, timestamptz, timestamptz) to authenticated;

commit;
