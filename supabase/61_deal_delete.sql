-- =====================================================================
-- Migration 61 — secure soft-delete for deals (roles + audit + commission)
-- Enforced server-side via delete_deal() RPC. Idempotent. Run once.
-- =====================================================================
begin;

-- 1) Audit fields (deleted already exists)
alter table public.deals add column if not exists deleted_at     timestamptz;
alter table public.deals add column if not exists deleted_by     uuid;
alter table public.deals add column if not exists deleted_reason text;
alter table public.deals add column if not exists delete_type    text;

-- 2) Master-admin helper (no is_master_admin existed; distinguish by role)
create or replace function public.is_master_admin()
 returns boolean language sql stable security definer set search_path to 'public'
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text = 'master_admin') $$;

-- 3) Immutable deletion audit log
create table if not exists public.deal_deletions (
  id               uuid primary key default gen_random_uuid(),
  deal_id          uuid not null,
  deal_no          int8,
  lead_id          uuid,
  agent_id         uuid,
  previous_status  text,
  deleted_by       uuid,
  deleted_by_role  text,
  delete_type      text,
  reason           text,
  created_at       timestamptz not null default now()
);
alter table public.deal_deletions enable row level security;
drop policy if exists deal_deletions_select on public.deal_deletions;
create policy deal_deletions_select on public.deal_deletions
  for select using ((select public.is_admin()) or (select public.is_master_admin()));
revoke all on public.deal_deletions from anon;
revoke insert, update, delete on public.deal_deletions from authenticated;
grant select on public.deal_deletions to authenticated;

-- 4) Guard: deletes can ONLY happen via delete_deal() (sets the bypass).
--    Any direct UPDATE touching the delete columns is rejected.
create or replace function public.guard_deal_soft_delete()
 returns trigger language plpgsql security definer set search_path to 'public'
as $guard$
begin
  if (new.deleted    is distinct from old.deleted
   or new.deleted_at is distinct from old.deleted_at
   or new.deleted_by is distinct from old.deleted_by)
   and coalesce(current_setting('app.deal_delete_bypass', true), 'off') <> 'on' then
    raise exception 'Deals must be deleted via delete_deal().';
  end if;
  return new;
end;
$guard$;

drop trigger if exists guard_deal_soft_delete on public.deals;
create trigger guard_deal_soft_delete
  before update on public.deals
  for each row execute function public.guard_deal_soft_delete();

-- 5) The one delete path. Enforces all role rules + writes the audit row.
create or replace function public.delete_deal(p_deal_id uuid, p_reason text default null)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $rpc$
declare
  v_role        text;
  v_deal        public.deals;
  v_reason      text := nullif(btrim(coalesce(p_reason, '')), '');
  v_delete_type text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select role::text into v_role from public.profiles where id = auth.uid();
  if v_role is null then
    raise exception 'No profile found for current user.';
  end if;

  select * into v_deal from public.deals where id = p_deal_id;
  if not found then
    raise exception 'Deal not found.';
  end if;
  if v_deal.deleted then
    raise exception 'This deal is already deleted.';
  end if;

  if v_role in ('admin','master_admin') then
    if v_reason is null then
      raise exception 'A reason is required to delete this deal.';
    end if;
    v_delete_type := 'admin';
  elsif v_role = 'agent' then
    if not (v_deal.agent_id = auth.uid() or v_deal.created_by = auth.uid()) then
      raise exception 'You can only delete your own deals.';
    end if;
    if v_deal.status <> 'draft' then
      raise exception 'Agents can only delete unsubmitted drafts. Ask an admin to remove submitted or approved deals.';
    end if;
    v_delete_type := 'agent_self';
    v_reason := coalesce(v_reason, 'Agent deleted own draft');
  else
    raise exception 'You are not permitted to delete deals.';
  end if;

  perform set_config('app.deal_delete_bypass', 'on', true);

  update public.deals
     set deleted        = true,
         deleted_at     = now(),
         deleted_by     = auth.uid(),
         deleted_reason = v_reason,
         delete_type    = v_delete_type,
         updated_at     = now()
   where id = p_deal_id;

  insert into public.deal_deletions
    (deal_id, deal_no, lead_id, agent_id, previous_status,
     deleted_by, deleted_by_role, delete_type, reason)
  values
    (v_deal.id, v_deal.deal_no, v_deal.lead_id, v_deal.agent_id, v_deal.status,
     auth.uid(), v_role, v_delete_type, v_reason);

  return jsonb_build_object(
    'ok', true, 'deal_id', v_deal.id,
    'previous_status', v_deal.status, 'delete_type', v_delete_type);
end;
$rpc$;

revoke execute on function public.delete_deal(uuid, text) from public, anon;
grant  execute on function public.delete_deal(uuid, text) to authenticated;

-- 6) Kill the direct hard-delete path; all deletes now go through the RPC.
revoke delete on public.deals from authenticated, anon;
drop policy if exists deals_delete on public.deals;

-- 7) Hide deleted deals from everyone except master admin -> they disappear
--    from lists, closed-deal views, and client-side commission automatically.
drop policy if exists deals_select on public.deals;
create policy deals_select on public.deals
  for select
  using (
    (select public.is_master_admin())
    or (
      ((select public.is_admin()) or agent_id = (select auth.uid()) or created_by = (select auth.uid()))
      and deleted = false
    )
  );

commit;

-- 8) Confirmation (the row you'll see)
select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='deals'
       and column_name in ('deleted_at','deleted_by','deleted_reason','delete_type')) as audit_cols,
  (select count(*) from pg_proc where proname='delete_deal'     and pronamespace='public'::regnamespace) as delete_rpc,
  (select count(*) from pg_proc where proname='is_master_admin' and pronamespace='public'::regnamespace) as master_helper,
  (to_regclass('public.deal_deletions') is not null)                                                     as audit_table,
  (select count(*) from pg_trigger where tgname='guard_deal_soft_delete')                               as guard_trigger;
