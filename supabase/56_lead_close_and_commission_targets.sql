-- 56_lead_close_and_commission_targets.sql
-- Amber Homes CRM — lead closing-lock + single-draft enforcement + commission targets.
-- ADDITIVE & IDEMPOTENT. Deletes no data. Safe to run once in the Supabase SQL editor.
-- Run AFTER 55. Logged-in users are unaffected except for the new, intended rules below.

begin;

-- =========================================================================
-- 1) LEADS: closing lock (lead permanently stays with the closing agent)
-- =========================================================================
alter table public.leads add column if not exists closed_locked  boolean not null default false;
alter table public.leads add column if not exists closed_by      uuid references public.profiles(id);
alter table public.leads add column if not exists closed_at       timestamptz;
alter table public.leads add column if not exists closed_deal_id  uuid;

-- helper: master_admin OR admin OR sales_manager (used by commission-target RLS).
create or replace function public.is_manager_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('master_admin','admin','sales_manager')
                   from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.is_manager_or_admin() from public, anon;
grant execute on function public.is_manager_or_admin() to authenticated;

-- Guard: once a lead is closed_locked it cannot be re-opened, reassigned, or
-- unlocked EXCEPT by a master admin. This catches every update path — manual
-- "Change Agent", mark_lead_open(), and the system auto-rotation (which runs with
-- auth.uid() = null, so is_master() is false and re-opening is blocked).
create or replace function public.guard_closed_lead_lock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(old.closed_locked, false) = true then
    -- block release to Open Leads
    if coalesce(new.is_open,false) = true and coalesce(old.is_open,false) = false
       and not public.is_master() then
      raise exception 'closed_locked: lead is locked to its closing agent; only a master admin can move it to Open Leads';
    end if;
    -- block reassignment to a different agent
    if new.assigned_agent is distinct from old.assigned_agent and not public.is_master() then
      raise exception 'closed_locked: only a master admin can reassign a closed lead';
    end if;
    -- block clearing the lock
    if coalesce(new.closed_locked,false) = false and not public.is_master() then
      raise exception 'closed_locked: only a master admin can unlock a closed lead';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_closed_lead_lock() from public, anon;

drop trigger if exists trg_guard_closed_lead_lock on public.leads;
create trigger trg_guard_closed_lead_lock
  before update on public.leads
  for each row execute function public.guard_closed_lead_lock();

-- =========================================================================
-- 2) DEALS: exactly one ACTIVE draft per (lead, agent)
-- =========================================================================
alter table public.deals add column if not exists archived boolean not null default false;

-- Archive (do NOT delete) older duplicate drafts, keeping the most recently
-- updated one per lead+agent. Data is preserved; archived rows are hidden from
-- the active-draft logic.
with ranked as (
  select id, row_number() over (
           partition by lead_id, agent_id
           order by coalesce(updated_at, created_at) desc, created_at desc
         ) as rn
  from public.deals
  where status = 'draft'
    and coalesce(deleted,false) = false
    and coalesce(archived,false) = false
    and lead_id is not null
)
update public.deals d
   set archived = true, updated_at = now()
  from ranked r
 where d.id = r.id and r.rn > 1;

-- Enforce a single active draft per lead+agent going forward.
create unique index if not exists deals_one_active_draft_per_lead_agent
  on public.deals (lead_id, agent_id)
  where status = 'draft' and deleted = false and archived = false and lead_id is not null;

-- =========================================================================
-- 3) COMMISSION TARGETS
-- =========================================================================
-- 3a) Company commission target — assigned by Manager / Admin / Master Admin.
create table if not exists public.agent_commission_targets (
  agent_id                  uuid primary key references public.profiles(id) on delete cascade,
  monthly_commission_target numeric,
  set_by                    uuid references public.profiles(id),
  updated_at                timestamptz not null default now()
);
alter table public.agent_commission_targets enable row level security;
revoke all on public.agent_commission_targets from anon;
grant select, insert, update on public.agent_commission_targets to authenticated;

drop policy if exists act_read on public.agent_commission_targets;
create policy act_read on public.agent_commission_targets for select to authenticated
  using ( agent_id = auth.uid() or public.is_manager_or_admin() );
drop policy if exists act_write on public.agent_commission_targets;
create policy act_write on public.agent_commission_targets for all to authenticated
  using ( public.is_manager_or_admin() ) with check ( public.is_manager_or_admin() );

-- 3b) Personal commission target — set ONLY by the agent themselves.
create table if not exists public.agent_personal_targets (
  agent_id                  uuid primary key references public.profiles(id) on delete cascade,
  monthly_commission_target numeric,
  updated_at                timestamptz not null default now()
);
alter table public.agent_personal_targets enable row level security;
revoke all on public.agent_personal_targets from anon;
grant select, insert, update on public.agent_personal_targets to authenticated;

drop policy if exists apt_read on public.agent_personal_targets;
create policy apt_read on public.agent_personal_targets for select to authenticated
  using ( agent_id = auth.uid() or public.is_manager_or_admin() );
drop policy if exists apt_insert on public.agent_personal_targets;
create policy apt_insert on public.agent_personal_targets for insert to authenticated
  with check ( agent_id = auth.uid() );
drop policy if exists apt_update on public.agent_personal_targets;
create policy apt_update on public.agent_personal_targets for update to authenticated
  using ( agent_id = auth.uid() ) with check ( agent_id = auth.uid() );

-- keep updated_at fresh (reuses the existing helper from 34_agent_targets.sql)
drop trigger if exists act_touch on public.agent_commission_targets;
create trigger act_touch before update on public.agent_commission_targets
  for each row execute function public.targets_touch();
drop trigger if exists apt_touch on public.agent_personal_targets;
create trigger apt_touch before update on public.agent_personal_targets
  for each row execute function public.targets_touch();

commit;

-- VERIFY (read-only):
--   select column_name from information_schema.columns where table_name='leads' and column_name like 'closed%';
--   select indexname from pg_indexes where tablename='deals' and indexname='deals_one_active_draft_per_lead_agent';
--   select tablename from pg_tables where tablename in ('agent_commission_targets','agent_personal_targets');
--   select tgname from pg_trigger where tgname='trg_guard_closed_lead_lock';
