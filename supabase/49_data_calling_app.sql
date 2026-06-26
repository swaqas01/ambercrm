-- 49_data_calling_app.sql
-- Frontend support for the Data Calling section.
-- Agents can READ their worklist (data_calling_agent_view) and INSERT their own
-- activity rows (call/whatsapp) directly. They CANNOT update the data_calling base
-- table (admin-only RLS), so seller-intent / status writes go through these
-- SECURITY DEFINER RPCs, mirroring the app's existing reveal_contact / mark_lead_open pattern.

-- 1) Save a call disposition: assigned agent (or data-calling admin) updates the
--    record's status + seller intent, and we log a 'disposition' activity row.
create or replace function public.data_calling_set_disposition(
  p_record_id      uuid,
  p_status         text        default null,
  p_wants_to_sell  boolean     default null,
  p_wants_to_list  boolean     default null,
  p_listed_with_us boolean     default null,
  p_sale_status    text        default null,
  p_comment        text        default null,
  p_follow_up_at   timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_allowed boolean;
begin
  if v_uid is null then
    return jsonb_build_object('error','unauthenticated');
  end if;

  select (
    exists (select 1 from data_calling_assignment a
            where a.data_calling_id = p_record_id and a.agent_id = v_uid and a.active)
    or public.dc_is_admin()
  ) into v_allowed;

  if not coalesce(v_allowed,false) then
    return jsonb_build_object('error','forbidden');
  end if;

  update data_calling c set
    status             = coalesce(p_status, c.status),
    sale_status        = coalesce(p_sale_status, c.sale_status),
    wants_to_sell      = coalesce(p_wants_to_sell, c.wants_to_sell),
    wants_to_list      = coalesce(p_wants_to_list, c.wants_to_list),
    listed_with_us     = coalesce(p_listed_with_us, c.listed_with_us),
    details_updated_by = v_uid,
    details_updated_at = now(),
    updated_at         = now()
  where c.id = p_record_id;

  if not found then
    return jsonb_build_object('error','not_found');
  end if;

  insert into data_calling_activity (data_calling_id, agent_id, action, comment, follow_up_at, meta)
  values (p_record_id, v_uid, 'disposition', nullif(p_comment,''), p_follow_up_at,
          jsonb_build_object(
            'outcome', p_status, 'sale_status', p_sale_status,
            'wants_to_sell', p_wants_to_sell, 'wants_to_list', p_wants_to_list,
            'listed_with_us', p_listed_with_us));

  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.data_calling_set_disposition(uuid,text,boolean,boolean,boolean,text,text,timestamptz) to authenticated;

-- 2) Optional: log a call/whatsapp from a context where the keepalive REST insert
--    isn't suitable. (The app logs calls via a keepalive insert; this is a safe fallback.)
create or replace function public.data_calling_log_touch(
  p_record_id uuid, p_action text, p_meta jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  if p_action not in ('call','whatsapp','reveal') then
    return jsonb_build_object('error','bad_action');
  end if;
  insert into data_calling_activity (data_calling_id, agent_id, action, meta)
  values (p_record_id, v_uid, p_action, coalesce(p_meta,'{}'::jsonb));
  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.data_calling_log_touch(uuid,text,jsonb) to authenticated;

-- 3) Manager/admin team stats (per agent) over a period. Returns nothing to non-managers.
create or replace function public.data_calling_manager_stats(
  p_since timestamptz default (now() - interval '30 days')
) returns table (
  agent_id uuid, agent_name text, assigned bigint,
  calls bigint, whatsapp bigint, dispositions bigint,
  reached bigint, owners_contacted bigint, conversions bigint
)
language sql
security definer
set search_path = public
as $$
  with mgr as (
    select (public.dc_is_admin()
      or exists (select 1 from profiles p where p.id = auth.uid()
                 and p.role in ('sales_manager','admin','master_admin'))) as ok
  )
  select
    pr.id, pr.full_name,
    (select count(*) from data_calling_assignment a where a.agent_id = pr.id and a.active),
    count(*) filter (where act.action = 'call'),
    count(*) filter (where act.action = 'whatsapp'),
    count(*) filter (where act.action = 'disposition'),
    count(*) filter (where act.action = 'disposition'
        and coalesce(act.meta->>'outcome','') not in ('no_answer','wrong_number','dnc','')),
    count(distinct act.data_calling_id) filter (where act.action in ('call','whatsapp','disposition')),
    count(distinct act.data_calling_id) filter (where act.action = 'disposition'
        and ((act.meta->>'wants_to_sell')::boolean is true
          or (act.meta->>'wants_to_list')::boolean is true
          or (act.meta->>'listed_with_us')::boolean is true))
  from profiles pr
  join data_calling_activity act on act.agent_id = pr.id and act.created_at >= p_since
  where (select ok from mgr)
  group by pr.id, pr.full_name
  order by count(*) filter (where act.action = 'call') desc;
$$;
grant execute on function public.data_calling_manager_stats(timestamptz) to authenticated;

-- 4) Admin assignment helper: assign up to N unassigned records of a project to an agent.
create or replace function public.data_calling_assign_by_project(
  p_project text, p_agent uuid, p_count int default 50
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_n int;
begin
  if not public.dc_is_admin() then
    return jsonb_build_object('error','forbidden');
  end if;
  with cand as (
    select c.id from data_calling c
    where c.project_name = p_project
      and not exists (select 1 from data_calling_assignment a
                      where a.data_calling_id = c.id and a.active)
    limit greatest(coalesce(p_count,0),0)
  )
  insert into data_calling_assignment (data_calling_id, agent_id, assigned_by, active)
  select id, p_agent, auth.uid(), true from cand;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'assigned', v_n);
end;
$$;
grant execute on function public.data_calling_assign_by_project(text,uuid,int) to authenticated;
