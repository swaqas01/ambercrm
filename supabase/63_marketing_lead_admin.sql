-- 63_marketing_lead_admin.sql
-- Amber Homes — give the 'marketing' role full lead visibility + assignment, matching master_admin
-- for leads only. Marketing is the lead-distribution role but is NOT is_admin(), so today it can see
-- only its own/open leads and cannot reassign another agent's lead. This migration adds a dedicated
-- helper (is_lead_admin = master_admin OR marketing) and threads it through exactly the four gates that
-- were blocking marketing: the leads SELECT / UPDATE / INSERT policies, the ownership guard trigger, and
-- the profiles read policy (so marketing can load the agent roster to pick an assignee).
--
-- SAFE / IDEMPOTENT / ADDITIVE. Deletes no data. Does NOT touch is_admin()/is_master(), so the
-- operational 'admin' role keeps its intentionally-limited lead visibility (unassigned + own only),
-- and marketing gains nothing beyond leads (no AI logs, audit, deals, or delete rights).
--
-- ROLLBACK: re-run migrations 25 (leads_select), 45 (leads_insert/update), 12 (guard_protected_columns),
-- 48 (profiles_read_self) to restore the master/admin-only bodies, and drop function is_lead_admin().

begin;

-- 1) Helper: roles that may see and assign EVERY lead. master_admin is already covered by is_admin()
--    everywhere it matters; the real delta here is 'marketing'.
create or replace function public.is_lead_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('master_admin','marketing')
                   from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.is_lead_admin() from public, anon;
grant  execute on function public.is_lead_admin() to authenticated;

-- 2) LEADS SELECT — marketing now sees all ACTIVE leads (master still sees everything incl. deleted).
--    Preserves the existing per-row scope for agents / ops-admin exactly; only adds is_lead_admin().
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select using (
  public.is_master()
  or ( deleted = false and (
        public.is_lead_admin()
        or assigned_agent = auth.uid()
        or current_owner  = auth.uid()
        or created_by     = auth.uid()
        or is_open        = true
        or ( public.is_ops_admin() and assigned_agent is null )
  ) )
);

-- 3) LEADS UPDATE — marketing can update/assign any lead (same rights admins already have).
alter policy leads_update on public.leads using (
  (select public.is_admin()) or (select public.is_lead_admin())
  or assigned_agent = (select auth.uid()) or current_owner = (select auth.uid())
) with check (
  (select public.is_admin()) or (select public.is_lead_admin())
  or assigned_agent = (select auth.uid()) or current_owner = (select auth.uid())
);

-- 4) LEADS INSERT — marketing may also add leads (assign to anyone), like an admin.
alter policy leads_insert on public.leads with check (
  (select public.is_admin()) or (select public.is_lead_admin())
  or ( created_by = (select auth.uid()) and assigned_agent = (select auth.uid()) )
);

-- 5) OWNERSHIP GUARD — the trigger blocks non-admins from changing ownership/contact fields, which would
--    otherwise reject marketing's assignment. Allow is_lead_admin() through as well. (Body is the current
--    12_followups.sql version, unchanged except the privileged check; trigger leads_guard already exists.)
create or replace function public.guard_protected_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_lead_admin()) then
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

-- 6) PROFILES READ — marketing must read the agent roster to choose an assignee. Adds is_lead_admin()
--    to the existing "own row OR is_admin" read policy.
alter policy profiles_read_self on public.profiles using (
  (id = (select auth.uid())) or (select public.is_admin()) or (select public.is_lead_admin())
);

commit;
