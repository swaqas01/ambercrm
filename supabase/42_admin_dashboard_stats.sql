-- 42_admin_dashboard_stats.sql
-- Amber Homes — server-side aggregates for the Admin/Live dashboard.
-- WHY: AdminDash was fetching every lead (~7k rows) plus 5k deals + 5k activity rows to the browser
-- and computing all the counts in JavaScript. Over the Tokyo region + Nano compute, that burst is the
-- ~20s load. This function computes the lead-derived numbers in one query and returns a small JSON
-- summary, so the dashboard ships a few hundred bytes instead of several MB.
--
-- VISIBILITY: mirrors the leads_select RLS exactly — a master sees all active leads; anyone else sees
-- only their own + open-pool leads — so the numbers match what each role saw before. Active leads only
-- (deleted excluded), which also aligns the dashboard Total with the leads list.

create or replace function public.admin_dashboard_stats()
returns jsonb language sql stable security definer set search_path = public as $$
with d as (
  select (now() at time zone 'Asia/Dubai')::date as today
),
ld as (
  select
    l.*,
    (l.created_at at time zone 'Asia/Dubai')::date as c_d,
    (coalesce(l.updated_at, l.created_at) at time zone 'Asia/Dubai')::date as w_d,
    case when l.next_followup is null then null else nullif(l.next_followup::text, '')::date end as nf_d
  from public.leads l
  where l.deleted is not true
    and (
      public.is_master()
      or l.assigned_agent = auth.uid()
      or l.current_owner  = auth.uid()
      or l.created_by     = auth.uid()
      or l.is_open = true
    )
),
an as (   -- active staff account names, for the "assigned to a real active agent" test
  select lower(trim(full_name)) as nm
  from public.profiles
  where active is not false
    and role in ('agent','sales_manager','admin','master_admin','marketing','accounts')
    and full_name is not null and trim(full_name) <> ''
),
la as (
  select
    ld.*,
    (
      ld.assigned_agent is not null
      or ld.current_owner is not null
      or (ld.assigned_agent_name is not null and lower(trim(ld.assigned_agent_name)) in (select nm from an))
    ) as is_assigned
  from ld
)
select jsonb_build_object(
  'total',          (select count(*) from ld),
  'today_new',      (select count(*) from ld, d where c_d = d.today),
  'month_new',      (select count(*) from ld, d where date_trunc('month', c_d::timestamp) = date_trunc('month', d.today::timestamp)),
  'quarter_new',    (select count(*) from ld, d where extract(year from c_d) = extract(year from d.today) and extract(quarter from c_d) = extract(quarter from d.today)),
  'year_new',       (select count(*) from ld, d where extract(year from c_d) = extract(year from d.today)),
  'open_pool',      (select count(*) from ld where is_open),
  'hot',            (select count(*) from ld where temperature = 'Hot'),
  'very_hot',       (select count(*) from ld where temperature = 'Very Hot'),
  'due_today',      (select count(*) from ld, d where nf_d is not null and nf_d <= d.today and status not in ('Closed Won','Closed Lost')),
  'overdue',        (select count(*) from ld, d where nf_d is not null and nf_d <  d.today and status not in ('Closed Won','Closed Lost')),
  'won_total',      (select count(*) from ld where status = 'Closed Won'),
  'won_month',      (select count(*) from ld, d where status = 'Closed Won' and date_trunc('month', w_d::timestamp) = date_trunc('month', d.today::timestamp)),
  'won_quarter',    (select count(*) from ld, d where status = 'Closed Won' and extract(year from w_d) = extract(year from d.today) and extract(quarter from w_d) = extract(quarter from d.today)),
  'won_year',       (select count(*) from ld, d where status = 'Closed Won' and extract(year from w_d) = extract(year from d.today)),
  'assigned_total', (select count(*) from la where is_assigned),
  'unassigned',     (select count(*) from la where not is_assigned),
  'avg_deal_won',   (select coalesce(sum(case when deal_value::text ~ '^-?[0-9]+(\.[0-9]+)?$' then deal_value::numeric else 0 end), 0) / nullif(count(*), 0) from ld where status = 'Closed Won'),
  'pipeline_value', (select coalesce(sum(case when deal_value::text ~ '^-?[0-9]+(\.[0-9]+)?$' then deal_value::numeric else 0 end), 0) from ld where status not in ('Closed Won','Closed Lost','Dead Lead')),
  'agents',         (select coalesce(jsonb_agg(jsonb_build_object('nm', nm, 'assigned', a, 'won', w, 'overdue', od) order by a desc), '[]'::jsonb)
                     from (
                       select assigned_agent_name as nm,
                              count(*) as a,
                              count(*) filter (where status = 'Closed Won') as w,
                              count(*) filter (where nf_d is not null and nf_d < (select today from d) and status not in ('Closed Won','Closed Lost')) as od
                       from ld
                       where assigned_agent_name is not null and trim(assigned_agent_name) <> ''
                       group by assigned_agent_name
                     ) t),
  'sources',        (select coalesce(jsonb_agg(jsonb_build_object('s', s, 'n', n) order by n desc), '[]'::jsonb)
                     from (
                       select coalesce(nullif(source, ''), 'Unknown') as s, count(*) as n
                       from ld
                       group by coalesce(nullif(source, ''), 'Unknown')
                     ) t)
);
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;
