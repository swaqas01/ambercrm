-- 62_data_calling_redesign.sql
-- Data Calling: fix the upload (dedup), fix + extend per-project counts, add Open Calling
-- per project, richer assignment (selected / bulk multi-agent / reassign / whole project),
-- extend activity tracking, and rebuild the worklist + admin views.
--
-- Data Calling stays a fully SEPARATE silo. Nothing here touches leads / open_leads and no
-- view or function joins the two datasets.
--
-- Backward compatible: the currently-deployed UI keeps working (all RPCs it calls still exist
-- with the same signatures); the new UI (pushed after this runs) uses the new capabilities.

begin;

-- =========================================================
-- 0) Role helper (view/report tier = master_admin + admin + sales_manager)
--    dc_is_admin() already exists = master_admin + admin (write tier).
-- =========================================================
create or replace function public.dc_can_manage() returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('master_admin','admin','sales_manager'));
$fn$;
grant execute on function public.dc_can_manage() to authenticated;

-- =========================================================
-- 1) Canonical de-dup key
--    project + unit + phone ; if unit missing -> project + owner + phone.
--    Phone reduced to digits so +9715..., 009715..., 05... compare consistently.
-- =========================================================
create or replace function public.dc_dedup_key(
  p_project text, p_unit text, p_owner text, p_phone text
) returns text language sql immutable as $fn$
  select lower(coalesce(btrim(p_project),''))
      || '|' || case when coalesce(btrim(p_unit),'') <> ''
                     then 'u:' || lower(btrim(p_unit))
                     else 'o:' || lower(coalesce(btrim(p_owner),'')) end
      || '|' || regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
$fn$;

-- =========================================================
-- 2) UPLOAD FIX
-- =========================================================

-- 2a) drop ONLY the trigger(s) whose function references dedup_key (surgical: leaves any
--     unrelated triggers such as updated_at intact).
do $do$
declare r record;
begin
  for r in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal
      and t.tgrelid = 'public.data_calling'::regclass
      and pg_get_functiondef(p.oid) ilike '%dedup_key%'
  loop
    execute format('drop trigger %I on public.data_calling', r.tgname);
  end loop;
end
$do$;

-- 2b) drop the broken unique (the constraint owns its index, so this removes both)
alter table public.data_calling drop constraint if exists data_calling_dedup_uniq;
drop index if exists public.data_calling_dedup_uniq;

-- 2c) REPLACE the dedup_key column.
--     dedup_key is a GENERATED ALWAYS ... STORED column whose old expression collapses every
--     row to one key. On PG < 17 a generated expression can't be altered in place, so drop and
--     re-add it with the correct expression. Because it is generated + immutable it auto-computes
--     for every existing row (no backfill) and can never drift out of sync with its row.
alter table public.data_calling drop column if exists dedup_key cascade;
alter table public.data_calling
  add column dedup_key text
  generated always as (public.dc_dedup_key(project_name, unit_number, owner_name, owner_phone)) stored;

-- 2d) recreate the unique index on the now-correct generated key
create unique index if not exists data_calling_dedup_uniq
  on public.data_calling (dedup_key);

-- 2e) rewrite the uploader: owns de-dup, sets dedup_key explicitly, reports full per-row results.
--     (return type changes text -> jsonb, so drop first)
drop function if exists public.upload_data_calling(jsonb, text);
create function public.upload_data_calling(
  p_rows jsonb, p_source_file text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $fn$
declare
  v_received int := 0; v_valid int := 0; v_inserted int := 0;
  v_dup_file int := 0; v_dup_db int := 0; v_invalid int := 0;
  v_errors jsonb := '[]'::jsonb;
begin
  if not public.dc_is_admin() then
    return jsonb_build_object('error','admin only');
  end if;

  select count(*) into v_received
  from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb));

  with parsed as (
    select e.ord::int as row_no,
      nullif(btrim(e.val->>'project_name'),'')     as project_name,
      nullif(btrim(e.val->>'project_location'),'') as project_location,
      nullif(btrim(e.val->>'unit_number'),'')      as unit_number,
      nullif(btrim(e.val->>'owner_name'),'')       as owner_name,
      nullif(btrim(e.val->>'owner_phone'),'')      as owner_phone,
      nullif(btrim(e.val->>'owner_email'),'')      as owner_email
    from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb)) with ordinality as e(val, ord)
  ),
  tagged as (
    select p.*,
      (p.project_name is null or p.owner_name is null) as invalid,
      public.dc_dedup_key(p.project_name, p.unit_number, p.owner_name, p.owner_phone) as k
    from parsed p
  ),
  invalid_rows as (select * from tagged where invalid),
  valid_ranked as (
    select t.*, row_number() over (partition by t.k order by t.row_no) as rn
    from tagged t where not t.invalid
  ),
  file_dups as (select * from valid_ranked where rn > 1),
  first_each as (select * from valid_ranked where rn = 1),
  db_dups as (
    select f.* from first_each f
    where exists (select 1 from public.data_calling d where d.dedup_key = f.k)
  ),
  to_insert as (
    select f.* from first_each f
    where not exists (select 1 from public.data_calling d where d.dedup_key = f.k)
  ),
  ins as (
    insert into public.data_calling
      (project_name, project_location, unit_number, owner_name, owner_phone, owner_email, source_file)
    select project_name, project_location, unit_number, owner_name, owner_phone, owner_email, p_source_file
    from to_insert
    on conflict (dedup_key) do nothing
    returning 1
  )
  select
    (select count(*) from tagged where not invalid),
    (select count(*) from ins),
    (select count(*) from file_dups),
    (select count(*) from db_dups),
    (select count(*) from invalid_rows),
    (select coalesce(jsonb_agg(jsonb_build_object(
        'row', row_no,
        'reason', case when project_name is null and owner_name is null then 'missing project and owner name'
                       when project_name is null then 'missing project name'
                       else 'missing owner name' end,
        'project', project_name, 'owner', owner_name) order by row_no), '[]'::jsonb)
      from invalid_rows)
  into v_valid, v_inserted, v_dup_file, v_dup_db, v_invalid, v_errors;

  return jsonb_build_object(
    'received', v_received,
    'valid', v_valid,
    'inserted', v_inserted,
    'duplicate_in_file', v_dup_file,
    'duplicate_in_db', v_dup_db,
    'duplicates', v_dup_file + v_dup_db,
    'skipped_invalid', v_invalid,
    'skipped', v_dup_file + v_dup_db + v_invalid,   -- back-compat total for the old UI
    'errors', v_errors
  );
end;
$fn$;
grant execute on function public.upload_data_calling(jsonb, text) to authenticated;

-- =========================================================
-- 3) OPEN CALLING per project
-- =========================================================
create table if not exists public.data_calling_project_settings (
  project_name text primary key,
  open_calling boolean not null default false,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.data_calling_project_settings enable row level security;

drop policy if exists dcps_admin_all on public.data_calling_project_settings;
create policy dcps_admin_all on public.data_calling_project_settings
  for all using (public.dc_is_admin()) with check (public.dc_is_admin());

drop policy if exists dcps_read_all on public.data_calling_project_settings;
create policy dcps_read_all on public.data_calling_project_settings
  for select using (auth.uid() is not null);

grant select on public.data_calling_project_settings to authenticated;

create or replace function public.data_calling_set_open_calling(
  p_project text, p_open boolean
) returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not public.dc_is_admin() then return jsonb_build_object('error','forbidden'); end if;
  if coalesce(btrim(p_project),'') = '' then return jsonb_build_object('error','bad_args'); end if;
  insert into public.data_calling_project_settings(project_name, open_calling, updated_by, updated_at)
  values (p_project, coalesce(p_open,false), auth.uid(), now())
  on conflict (project_name) do update
    set open_calling = excluded.open_calling, updated_by = auth.uid(), updated_at = now();
  return jsonb_build_object('ok', true, 'project', p_project, 'open_calling', coalesce(p_open,false));
end;
$fn$;
grant execute on function public.data_calling_set_open_calling(text, boolean) to authenticated;

-- =========================================================
-- 4) ACTIVITY: extend allowed actions (keep the *_click scheme; add status + assignment)
-- =========================================================
alter table public.data_calling_activity drop constraint if exists data_calling_activity_action_check;
alter table public.data_calling_activity add constraint data_calling_activity_action_check
  check (action in (
    'reveal','call_click','whatsapp_click','email_click','comment',
    'follow_up_created','follow_up_completed','status_change',
    'assigned','unassigned','converted'
  ));

-- =========================================================
-- 5) DISPOSITION (fix: log allowed actions, tolerate status values, allow Open-Calling access)
-- =========================================================
create or replace function public.data_calling_set_disposition(
  p_record_id uuid, p_status text default null, p_wants_to_sell boolean default null,
  p_wants_to_list boolean default null, p_listed_with_us boolean default null,
  p_sale_status text default null, p_comment text default null, p_follow_up_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_allowed boolean; v_proj text;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  select c.project_name into v_proj from public.data_calling c where c.id = p_record_id;
  if v_proj is null then return jsonb_build_object('error','not_found'); end if;

  v_allowed :=
    public.dc_is_admin()
    or exists (select 1 from public.data_calling_assignment a
               where a.data_calling_id = p_record_id and a.agent_id = v_uid and a.active)
    or exists (select 1 from public.data_calling_project_settings s
               where s.project_name = v_proj and s.open_calling);
  if not v_allowed then return jsonb_build_object('error','forbidden'); end if;

  update public.data_calling c set
    status = case when p_status in ('new','in_progress','converted','dead') then p_status else c.status end,
    sale_status = case when p_sale_status in
        ('Selling','Not Selling','Sold','Wrong Number','Number not valid','Not Valid Owner')
        then p_sale_status else c.sale_status end,
    wants_to_sell  = coalesce(p_wants_to_sell,  c.wants_to_sell),
    wants_to_list  = coalesce(p_wants_to_list,  c.wants_to_list),
    listed_with_us = coalesce(p_listed_with_us, c.listed_with_us),
    details_updated_by = v_uid, details_updated_at = now(), updated_at = now()
  where c.id = p_record_id;

  insert into public.data_calling_activity (data_calling_id, agent_id, action, meta)
  values (p_record_id, v_uid, 'status_change',
    jsonb_build_object('status', p_status, 'sale_status', p_sale_status,
      'wants_to_sell', p_wants_to_sell, 'wants_to_list', p_wants_to_list, 'listed_with_us', p_listed_with_us));

  if coalesce(btrim(p_comment),'') <> '' then
    insert into public.data_calling_activity (data_calling_id, agent_id, action, comment)
    values (p_record_id, v_uid, 'comment', btrim(p_comment));
  end if;

  if p_follow_up_at is not null then
    insert into public.data_calling_activity (data_calling_id, agent_id, action, follow_up_at)
    values (p_record_id, v_uid, 'follow_up_created', p_follow_up_at);
  end if;

  return jsonb_build_object('ok', true);
end;
$fn$;
grant execute on function public.data_calling_set_disposition(uuid,text,boolean,boolean,boolean,text,text,timestamptz) to authenticated;

-- =========================================================
-- 6) COVERAGE / COUNTS per project (rich breakdown; managers + admins)
--    (old data_calling_unassigned_by_project is LEFT INTACT for the current UI.)
-- =========================================================
create or replace function public.data_calling_project_overview()
returns table (
  project_name text, total bigint, assigned bigint, unassigned bigint,
  open_calling boolean, contacted bigint, pending bigint
) language plpgsql security definer set search_path = public as $fn$
begin
  if not public.dc_can_manage() then raise exception 'not authorized'; end if;
  return query
  with base as (
    select c.id, c.project_name,
      exists (select 1 from public.data_calling_assignment a
              where a.data_calling_id = c.id and a.active) as is_assigned,
      exists (select 1 from public.data_calling_activity act
              where act.data_calling_id = c.id
                and act.action in ('call_click','whatsapp_click','status_change','converted')) as is_contacted
    from public.data_calling c
  )
  select b.project_name,
    count(*)::bigint,
    count(*) filter (where b.is_assigned)::bigint,
    count(*) filter (where not b.is_assigned)::bigint,
    coalesce((select s.open_calling from public.data_calling_project_settings s
              where s.project_name = b.project_name), false),
    count(*) filter (where b.is_contacted)::bigint,
    count(*) filter (where not b.is_contacted)::bigint
  from base b
  group by b.project_name
  order by b.project_name;
end;
$fn$;
grant execute on function public.data_calling_project_overview() to authenticated;

-- =========================================================
-- 7) ASSIGNMENT RPCs (selected / bulk multi-agent / unassign / whole project). All reassign-safe.
-- =========================================================

-- assign a specific set of records to ONE agent (reassigns any current holder)
create or replace function public.data_calling_assign_records(
  p_ids uuid[], p_agent uuid
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_n int := 0;
begin
  if not public.dc_is_admin() then return jsonb_build_object('error','forbidden'); end if;
  if p_agent is null or p_ids is null or array_length(p_ids,1) is null then
    return jsonb_build_object('error','bad_args');
  end if;
  update public.data_calling_assignment a set active = false
  where a.data_calling_id = any(p_ids) and a.active;
  with ins as (
    insert into public.data_calling_assignment (data_calling_id, agent_id, assigned_by, active)
    select id, p_agent, auth.uid(), true from public.data_calling where id = any(p_ids)
    returning data_calling_id
  )
  insert into public.data_calling_activity (data_calling_id, agent_id, action, meta)
  select data_calling_id, p_agent, 'assigned', jsonb_build_object('by', auth.uid()) from ins;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'assigned', v_n);
end;
$fn$;
grant execute on function public.data_calling_assign_records(uuid[], uuid) to authenticated;

-- distribute a set of records ACROSS several agents (round-robin), reassign-safe
create or replace function public.data_calling_bulk_assign(
  p_ids uuid[], p_agents uuid[]
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_n int := 0;
begin
  if not public.dc_is_admin() then return jsonb_build_object('error','forbidden'); end if;
  if p_agents is null or array_length(p_agents,1) is null
     or p_ids is null or array_length(p_ids,1) is null then
    return jsonb_build_object('error','bad_args');
  end if;
  update public.data_calling_assignment a set active = false
  where a.data_calling_id = any(p_ids) and a.active;
  with ordered as (
    select id, row_number() over (order by id) as rn
    from public.data_calling where id = any(p_ids)
  ),
  mapped as (
    select o.id, p_agents[1 + ((o.rn - 1) % array_length(p_agents,1))] as agent_id
    from ordered o
  ),
  ins as (
    insert into public.data_calling_assignment (data_calling_id, agent_id, assigned_by, active)
    select id, agent_id, auth.uid(), true from mapped
    returning data_calling_id, agent_id
  )
  insert into public.data_calling_activity (data_calling_id, agent_id, action, meta)
  select data_calling_id, agent_id, 'assigned', jsonb_build_object('by', auth.uid(), 'bulk', true) from ins;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'assigned', v_n);
end;
$fn$;
grant execute on function public.data_calling_bulk_assign(uuid[], uuid[]) to authenticated;

-- unassign a set of records
create or replace function public.data_calling_unassign(p_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_n int := 0;
begin
  if not public.dc_is_admin() then return jsonb_build_object('error','forbidden'); end if;
  if p_ids is null or array_length(p_ids,1) is null then
    return jsonb_build_object('error','bad_args');
  end if;
  update public.data_calling_assignment a set active = false
  where a.data_calling_id = any(p_ids) and a.active;
  get diagnostics v_n = row_count;
  insert into public.data_calling_activity (data_calling_id, agent_id, action, meta)
  select id, auth.uid(), 'unassigned', jsonb_build_object('by', auth.uid())
  from public.data_calling where id = any(p_ids);
  return jsonb_build_object('ok', true, 'unassigned', v_n);
end;
$fn$;
grant execute on function public.data_calling_unassign(uuid[]) to authenticated;

-- assign a WHOLE project to one agent (optionally reassign already-assigned records too)
create or replace function public.data_calling_assign_project(
  p_project text, p_agent uuid, p_include_assigned boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_n int := 0;
begin
  if not public.dc_is_admin() then return jsonb_build_object('error','forbidden'); end if;
  if p_agent is null or coalesce(btrim(p_project),'') = '' then
    return jsonb_build_object('error','bad_args');
  end if;
  if coalesce(p_include_assigned,false) then
    update public.data_calling_assignment a set active = false
    where a.active and a.data_calling_id in (select id from public.data_calling where project_name = p_project);
  end if;
  with cand as (
    select c.id from public.data_calling c
    where c.project_name = p_project
      and not exists (select 1 from public.data_calling_assignment a
                      where a.data_calling_id = c.id and a.active)
  ),
  ins as (
    insert into public.data_calling_assignment (data_calling_id, agent_id, assigned_by, active)
    select id, p_agent, auth.uid(), true from cand
    returning data_calling_id
  )
  insert into public.data_calling_activity (data_calling_id, agent_id, action, meta)
  select data_calling_id, p_agent, 'assigned', jsonb_build_object('by', auth.uid(), 'project', p_project) from ins;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'assigned', v_n);
end;
$fn$;
grant execute on function public.data_calling_assign_project(text, uuid, boolean) to authenticated;

-- =========================================================
-- 8) REVEAL (allow Open-Calling access too)
-- =========================================================
create or replace function public.reveal_data_contact(p_record_id uuid)
returns table(owner_phone text, owner_email text)
language plpgsql security definer set search_path = public as $fn$
declare v_proj text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select c.project_name into v_proj from public.data_calling c where c.id = p_record_id;
  if v_proj is null then raise exception 'not found'; end if;
  if not (
    public.dc_is_admin()
    or exists (select 1 from public.data_calling_assignment a
               where a.data_calling_id = p_record_id and a.agent_id = auth.uid() and a.active)
    or exists (select 1 from public.data_calling_project_settings s
               where s.project_name = v_proj and s.open_calling)
  ) then raise exception 'not assigned to this record'; end if;

  insert into public.data_calling_activity (data_calling_id, agent_id, action)
  values (p_record_id, auth.uid(), 'reveal');

  return query select c.owner_phone, c.owner_email from public.data_calling c where c.id = p_record_id;
end;
$fn$;
grant execute on function public.reveal_data_contact(uuid) to authenticated;

-- =========================================================
-- 9) MANAGER STATS (rebuilt onto the *_click activity scheme; same return shape as before)
-- =========================================================
create or replace function public.data_calling_manager_stats(
  p_since timestamptz default (now() - interval '30 days')
) returns table (
  agent_id uuid, agent_name text, assigned bigint,
  calls bigint, whatsapp bigint, dispositions bigint,
  reached bigint, owners_contacted bigint, conversions bigint
) language sql security definer set search_path = public as $fn$
  select pr.id, pr.full_name,
    (select count(*) from public.data_calling_assignment a where a.agent_id = pr.id and a.active),
    count(*) filter (where act.action = 'call_click'),
    count(*) filter (where act.action = 'whatsapp_click'),
    count(*) filter (where act.action = 'status_change'),
    count(*) filter (where act.action = 'status_change'
       and coalesce(act.meta->>'status','') in ('in_progress','converted')),
    count(distinct act.data_calling_id) filter (where act.action in ('call_click','whatsapp_click','status_change')),
    count(distinct act.data_calling_id) filter (where act.action = 'status_change'
       and ((act.meta->>'wants_to_sell')::boolean is true
         or (act.meta->>'wants_to_list')::boolean is true
         or (act.meta->>'listed_with_us')::boolean is true))
  from public.profiles pr
  join public.data_calling_activity act on act.agent_id = pr.id and act.created_at >= p_since
  where public.dc_can_manage()
  group by pr.id, pr.full_name
  order by count(*) filter (where act.action = 'call_click') desc;
$fn$;
grant execute on function public.data_calling_manager_stats(timestamptz) to authenticated;

-- =========================================================
-- 10) AGENT WORKLIST VIEW  — records assigned to me OR in an Open-Calling project.
--     Masked contacts + flags (assigned_to_me, is_open_calling, assigned agent, last activity,
--     follow-up). Owner's-rights view so agents read through it without base-table RLS.
-- =========================================================
drop view if exists public.data_calling_agent_view;
create view public.data_calling_agent_view as
select
  c.id, c.project_name, c.project_location, c.owner_name, c.unit_number, c.status,
  case when c.owner_phone is null then null
       else '•••• ••' || right(regexp_replace(c.owner_phone,'\D','','g'), 2) end as owner_phone_masked,
  case when c.owner_email is null then null
       else '••••@' || split_part(c.owner_email,'@',2) end as owner_email_masked,
  c.property_type, c.built_up_area, c.plot_area, c.purchase_price, c.selling_price, c.sale_status,
  c.wants_to_sell, c.wants_to_list, c.listed_with_us, c.details_updated_at, c.created_at,
  (asg.agent_id = auth.uid())          as assigned_to_me,
  (osx.project_name is not null)       as is_open_calling,
  asg.agent_id                         as assigned_agent_id,
  ap.full_name                         as assigned_agent_name,
  la.last_activity_at, la.last_action,
  lc.last_comment, lc.last_comment_at,
  fu.next_follow_up_at
from public.data_calling c
left join lateral (
  select a.agent_id from public.data_calling_assignment a
  where a.data_calling_id = c.id and a.active limit 1
) asg on true
left join public.profiles ap on ap.id = asg.agent_id
left join public.data_calling_project_settings osx on osx.project_name = c.project_name and osx.open_calling
left join lateral (
  select max(a.created_at) as last_activity_at,
    (select a2.action from public.data_calling_activity a2
     where a2.data_calling_id = c.id order by a2.created_at desc limit 1) as last_action
  from public.data_calling_activity a where a.data_calling_id = c.id
) la on true
left join lateral (
  select a.comment as last_comment, a.created_at as last_comment_at
  from public.data_calling_activity a
  where a.data_calling_id = c.id and a.action = 'comment' and a.comment is not null
  order by a.created_at desc limit 1
) lc on true
left join lateral (
  select min(a.follow_up_at) as next_follow_up_at
  from public.data_calling_activity a
  where a.data_calling_id = c.id and a.action = 'follow_up_created' and a.follow_up_at >= now()
) fu on true
where
  exists (select 1 from public.data_calling_assignment a
          where a.data_calling_id = c.id and a.agent_id = auth.uid() and a.active)
  or (osx.project_name is not null);
grant select on public.data_calling_agent_view to authenticated;

-- =========================================================
-- 11) ADMIN / MANAGER VIEW — ALL records (for the "All Data" tab). Gated by dc_can_manage().
-- =========================================================
drop view if exists public.data_calling_admin_view;
create view public.data_calling_admin_view as
select
  c.id, c.project_name, c.project_location, c.owner_name, c.unit_number, c.status,
  case when c.owner_phone is null then null
       else '•••• ••' || right(regexp_replace(c.owner_phone,'\D','','g'), 2) end as owner_phone_masked,
  case when c.owner_email is null then null
       else '••••@' || split_part(c.owner_email,'@',2) end as owner_email_masked,
  c.property_type, c.built_up_area, c.plot_area, c.purchase_price, c.selling_price, c.sale_status,
  c.wants_to_sell, c.wants_to_list, c.listed_with_us, c.details_updated_at, c.created_at,
  asg.agent_id                   as assigned_agent_id,
  ap.full_name                   as assigned_agent_name,
  (osx.project_name is not null) as is_open_calling,
  la.last_activity_at, la.last_action,
  lc.last_comment, lc.last_comment_at,
  fu.next_follow_up_at
from public.data_calling c
left join lateral (
  select a.agent_id from public.data_calling_assignment a
  where a.data_calling_id = c.id and a.active limit 1
) asg on true
left join public.profiles ap on ap.id = asg.agent_id
left join public.data_calling_project_settings osx on osx.project_name = c.project_name and osx.open_calling
left join lateral (
  select max(a.created_at) as last_activity_at,
    (select a2.action from public.data_calling_activity a2
     where a2.data_calling_id = c.id order by a2.created_at desc limit 1) as last_action
  from public.data_calling_activity a where a.data_calling_id = c.id
) la on true
left join lateral (
  select a.comment as last_comment, a.created_at as last_comment_at
  from public.data_calling_activity a
  where a.data_calling_id = c.id and a.action = 'comment' and a.comment is not null
  order by a.created_at desc limit 1
) lc on true
left join lateral (
  select min(a.follow_up_at) as next_follow_up_at
  from public.data_calling_activity a
  where a.data_calling_id = c.id and a.action = 'follow_up_created' and a.follow_up_at >= now()
) fu on true
where public.dc_can_manage();
grant select on public.data_calling_admin_view to authenticated;

commit;

-- Post-check (optional): run these after commit to sanity-check.
-- select * from public.upload_data_calling('[]'::jsonb);            -- {"received":0,...}
-- select * from public.data_calling_project_overview();            -- per-project rich counts
