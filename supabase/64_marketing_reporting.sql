-- 64_marketing_reporting.sql
-- Amber Homes — server-side Marketing / lead-generation reporting.
--
-- Why RPCs (not client queries): the Marketing report must aggregate across EVERY lead + the full
-- assignment history, but leads RLS deliberately restricts what admin / manager / marketing can read.
-- So the numbers are computed by SECURITY DEFINER functions that bypass RLS but are gated by a role
-- check (can_view_marketing = master_admin / admin / sales_manager / marketing). Agents cannot call them.
--
-- "Originally assigned to" is derived from history, not the current owner: for each lead, the FIRST
-- agent it was ever handed to = earliest lead_ownership_history.to_agent (non-null); if a lead has no
-- history row it falls back to leads.original_agent, then the current assigned_agent. This means a lead
-- still counts for the agent it was first given to even after it is opened, reassigned, or goes inactive.
--
-- No schema change: leads already has `campaign` (optional, free-text) for campaign tracking.
-- SAFE / IDEMPOTENT / ADDITIVE. Reads only. ROLLBACK: drop the four functions below.

begin;

-- 1) Who may view Marketing reporting.
create or replace function public.can_view_marketing()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('master_admin','admin','sales_manager','marketing')
                   from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.can_view_marketing() from public, anon;
grant  execute on function public.can_view_marketing() to authenticated;

-- 2) Base rows: one row per active lead with the derived original agent, who first assigned it, and a
--    normalised source bucket. SECURITY DEFINER (bypasses RLS) BUT self-gated — returns nothing unless
--    the caller can_view_marketing(), so it can be granted to authenticated safely.
create or replace function public.marketing_base_rows()
returns table (
  id uuid, lead_code text, client_name text, source text, source_bucket text,
  project text, campaign text, status text, temperature text, is_open boolean,
  last_contacted date, last_contacted_at timestamptz, created_at timestamptz,
  deal_value numeric, orig_agent uuid, assigned_by_id uuid
)
language sql stable security definer set search_path = public as $$
  select
    l.id, l.lead_code, l.client_name, l.source,
    case
      when l.source ilike '%property%finder%' or l.source ilike '%propertyfinder%' then 'property_finder'
      when l.source ilike '%off%plan%'        or l.source ilike '%offplan%'        then 'off_plan'
      when l.source ilike '%campaign%' or l.source ilike '%meta%' or l.source ilike '%facebook%'
           or l.source ilike '%instagram%' or l.meta_lead_id is not null
           or (l.campaign is not null and l.campaign <> '')                         then 'campaign'
      when l.source ilike '%web%'                                                   then 'website'
      when l.source is null or l.source = '' or l.source ilike '%manual%'           then 'manual'
      else 'other'
    end as source_bucket,
    l.project, l.campaign, l.status, l.temperature, l.is_open,
    l.last_contacted, l.last_contacted_at, l.created_at, l.deal_value,
    coalesce(
      (select h.to_agent from public.lead_ownership_history h
        where h.lead_id = l.id and h.to_agent is not null
        order by h.created_at asc limit 1),
      l.original_agent, l.assigned_agent
    ) as orig_agent,
    coalesce(
      (select h.changed_by from public.lead_ownership_history h
        where h.lead_id = l.id and h.to_agent is not null
        order by h.created_at asc limit 1),
      l.created_by
    ) as assigned_by_id
  from public.leads l
  where l.deleted = false
    and public.can_view_marketing();   -- gate: no rows for unauthorised callers
$$;
revoke all on function public.marketing_base_rows() from public, anon;
grant  execute on function public.marketing_base_rows() to authenticated;

-- 3) The report: summary cards + agent breakdown + campaign/project breakdown + filter option lists.
create or replace function public.marketing_report(
  p_from        timestamptz default null,
  p_to          timestamptz default null,
  p_source      text        default null,
  p_campaign    text        default null,
  p_agent       uuid        default null,
  p_assigned_by uuid        default null
) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_view_marketing() then
    return jsonb_build_object('error', 'forbidden');
  end if;

  return (
    with dall as (   -- date-range scope only (drives the filter dropdowns)
      select * from public.marketing_base_rows()
      where (p_from is null or created_at >= p_from)
        and (p_to   is null or created_at <  p_to)
    ),
    f as (           -- all active filters (drives the numbers)
      select * from dall
      where (p_source      is null or source_bucket = p_source)
        and (p_campaign    is null or project = p_campaign or campaign = p_campaign)
        and (p_agent       is null or orig_agent = p_agent)
        and (p_assigned_by is null or assigned_by_id = p_assigned_by)
    )
    select jsonb_build_object(
      'summary', (
        select jsonb_build_object(
          'total_leads',     count(*),
          'property_finder', count(*) filter (where source_bucket = 'property_finder'),
          'off_plan',        count(*) filter (where source_bucket = 'off_plan'),
          'campaign',        count(*) filter (where source_bucket = 'campaign'),
          'website',         count(*) filter (where source_bucket = 'website'),
          'manual',          count(*) filter (where source_bucket = 'manual'),
          'other',           count(*) filter (where source_bucket = 'other'),
          'assigned',        count(*) filter (where orig_agent is not null),
          'unassigned',      count(*) filter (where orig_agent is null and is_open = false),
          'open_now',        count(*) filter (where is_open = true),
          'closed',          count(*) filter (where status = 'Closed Won')
        ) from f
      ),
      'agents', coalesce((
        select jsonb_agg(x order by (x->>'total')::int desc) from (
          select jsonb_build_object(
            'agent_id',        orig_agent,
            'agent_name',      coalesce((select full_name from public.profiles where id = orig_agent), 'Unknown'),
            'total',           count(*),
            'property_finder', count(*) filter (where source_bucket = 'property_finder'),
            'off_plan',        count(*) filter (where source_bucket = 'off_plan'),
            'campaign',        count(*) filter (where source_bucket = 'campaign'),
            'open_returned',   count(*) filter (where is_open = true),
            'contacted',       count(*) filter (where last_contacted is not null or last_contacted_at is not null),
            'closed',          count(*) filter (where status = 'Closed Won')
          ) as x
          from f where orig_agent is not null group by orig_agent
        ) a
      ), '[]'::jsonb),
      'campaigns', coalesce((
        select jsonb_agg(y order by (y->>'total')::int desc) from (
          select jsonb_build_object(
            'project',         coalesce(nullif(project, ''), '(No project)'),
            'total',           count(*),
            'campaigns',       count(distinct nullif(campaign, '')),
            'property_finder', count(*) filter (where source_bucket = 'property_finder'),
            'off_plan',        count(*) filter (where source_bucket = 'off_plan'),
            'campaign_leads',  count(*) filter (where source_bucket = 'campaign'),
            'contacted',       count(*) filter (where last_contacted is not null or last_contacted_at is not null),
            'uncontacted',     count(*) filter (where last_contacted is null and last_contacted_at is null),
            'closed',          count(*) filter (where status = 'Closed Won')
          ) as y
          from f group by coalesce(nullif(project, ''), '(No project)')
        ) c
      ), '[]'::jsonb),
      'options', jsonb_build_object(
        'agents', coalesce((
          select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name) order by p.full_name)
          from (select distinct orig_agent from dall where orig_agent is not null) da
          join public.profiles p on p.id = da.orig_agent
        ), '[]'::jsonb),
        'assigners', coalesce((
          select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name) order by p.full_name)
          from (select distinct assigned_by_id from dall where assigned_by_id is not null) db
          join public.profiles p on p.id = db.assigned_by_id
        ), '[]'::jsonb),
        'projects', coalesce((
          select jsonb_agg(distinct project order by project) from dall where project is not null and project <> ''
        ), '[]'::jsonb)
      )
    )
  );
end $$;
revoke all on function public.marketing_report(timestamptz, timestamptz, text, text, uuid, uuid) from public, anon;
grant  execute on function public.marketing_report(timestamptz, timestamptz, text, text, uuid, uuid) to authenticated;

-- 4) Drill-down: the individual leads behind a report cell (e.g. a project row).
create or replace function public.marketing_leads(
  p_from        timestamptz default null,
  p_to          timestamptz default null,
  p_source      text        default null,
  p_campaign    text        default null,
  p_agent       uuid        default null,
  p_assigned_by uuid        default null,
  p_project     text        default null
) returns table (
  id uuid, lead_code text, client_name text, source text, source_bucket text,
  project text, campaign text, status text, temperature text, is_open boolean,
  orig_agent uuid, orig_agent_name text, last_contacted date, created_at timestamptz, deal_value numeric
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_view_marketing() then return; end if;
  return query
    select b.id, b.lead_code, b.client_name, b.source, b.source_bucket, b.project, b.campaign,
           b.status, b.temperature, b.is_open, b.orig_agent,
           coalesce((select full_name from public.profiles where id = b.orig_agent), 'Unassigned'),
           b.last_contacted, b.created_at, b.deal_value
    from public.marketing_base_rows() b
    where (p_from        is null or b.created_at >= p_from)
      and (p_to          is null or b.created_at <  p_to)
      and (p_source      is null or b.source_bucket = p_source)
      and (p_campaign    is null or b.project = p_campaign or b.campaign = p_campaign)
      and (p_agent       is null or b.orig_agent = p_agent)
      and (p_assigned_by is null or b.assigned_by_id = p_assigned_by)
      and (p_project     is null or coalesce(nullif(b.project, ''), '(No project)') = p_project)
    order by b.created_at desc
    limit 2000;
end $$;
revoke all on function public.marketing_leads(timestamptz, timestamptz, text, text, uuid, uuid, text) from public, anon;
grant  execute on function public.marketing_leads(timestamptz, timestamptz, text, text, uuid, uuid, text) to authenticated;

commit;
