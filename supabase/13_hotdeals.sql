-- =====================================================================
-- Amber Lead Desk — Migration 13
--   * Hot Resale Deals module (table + RLS + server-side guard & notify)
--   * Project dashboard-announcement fields
--   * Profile fields for the upcoming profile page
--   * 2FA default ON for EVERY role (safe: auth falls back to password-only
--     when email delivery isn't configured, so no one is locked out)
-- Safe & idempotent.
-- =====================================================================

-- ---------- 1) profiles: profile-page fields + company-wide 2FA ----------
alter table public.profiles add column if not exists whatsapp     text;
alter table public.profiles add column if not exists avatar_url   text;
alter table public.profiles add column if not exists bio          text;
alter table public.profiles add column if not exists theme        text;       -- preferred theme key
alter table public.profiles add column if not exists joining_date date;
-- Company policy: 2FA required for everyone (agents already true from 11).
update public.profiles set twofa_required = true where twofa_required is distinct from true;

-- ---------- 2) projects: dashboard announcement controls ----------
alter table public.projects add column if not exists featured_on_dashboard boolean default false;
alter table public.projects add column if not exists announcement_text     text;
alter table public.projects add column if not exists announcement_priority int default 0;     -- higher = shown first
alter table public.projects add column if not exists announcement_expiry   date;

-- ---------- 3) Hot Resale Deals ----------
create table if not exists public.hot_resale_deals (
  id               uuid primary key default gen_random_uuid(),
  -- mandatory
  project_name     text not null,
  area             text not null,
  property_type    text not null,                 -- Apartment | Villa | Townhouse | Penthouse | Plot | Commercial | Other
  bedrooms         text,
  price            text not null,
  deal_summary     text not null,
  why_hot          text not null,
  contact_note     text,                          -- internal contact / note
  agent_id         uuid references public.profiles(id),
  agent_name       text,                          -- denormalised for "Posted by …"
  -- optional
  unit_number      text,
  size_sqft        text,
  view             text,
  floor            text,
  occupancy        text,                          -- Vacant | Rented | …
  seller_urgency   text,
  last_txn         text,
  market_price     text,
  expected_roi     text,
  photos           jsonb default '[]'::jsonb,
  documents        jsonb default '[]'::jsonb,
  listing_link     text,
  expiry_date      date,
  client_suitability text,
  whatsapp_pitch   text,
  -- admin / internal
  status           text not null default 'Pending Approval',  -- Draft | Pending Approval | Approved | Rejected | Needs Correction | Expired | Removed
  approved_by      uuid references public.profiles(id),
  approval_notes   text,
  internal_risk    text,
  visibility       text default 'all',
  featured         boolean default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists hot_deals_status_idx on public.hot_resale_deals(status);
create index if not exists hot_deals_agent_idx  on public.hot_resale_deals(agent_id);

drop trigger if exists hot_deals_touch on public.hot_resale_deals;
create trigger hot_deals_touch before update on public.hot_resale_deals
  for each row execute function public.touch_updated_at();

alter table public.hot_resale_deals enable row level security;

-- Agents see APPROVED deals (the shared board) + their own submissions. Admins see all.
drop policy if exists hot_deals_select on public.hot_resale_deals;
create policy hot_deals_select on public.hot_resale_deals for select using (
  public.is_admin() or status = 'Approved' or agent_id = auth.uid()
);
-- Insert: an agent files their own; admins anything.
drop policy if exists hot_deals_insert on public.hot_resale_deals;
create policy hot_deals_insert on public.hot_resale_deals for insert with check (
  public.is_admin() or agent_id = auth.uid()
);
-- Update: admins anything; an agent may edit their own (the guard trigger restricts WHAT they may change).
drop policy if exists hot_deals_update on public.hot_resale_deals;
create policy hot_deals_update on public.hot_resale_deals for update using (
  public.is_admin() or agent_id = auth.uid()
) with check (
  public.is_admin() or agent_id = auth.uid()
);
-- no delete policy: deals are Removed (status), not destroyed.

-- Guard: non-admins cannot self-approve or touch approval/visibility/owner fields,
-- can only use agent statuses, and can only edit a deal that's Draft / Needs Correction.
create or replace function public.guard_hot_deal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if TG_OP = 'INSERT' then
      if new.status not in ('Draft','Pending Approval') then
        raise exception 'Not allowed: a new deal must start as Draft or Pending Approval';
      end if;
      new.approved_by := null; new.approval_notes := null; new.internal_risk := null; new.featured := false;
    elsif TG_OP = 'UPDATE' then
      if old.status not in ('Draft','Needs Correction') then
        raise exception 'Not allowed: this deal can no longer be edited';
      end if;
      if new.status not in ('Draft','Pending Approval') then
        raise exception 'Not allowed: agents cannot set this status';
      end if;
      if new.approved_by  is distinct from old.approved_by
         or new.approval_notes is distinct from old.approval_notes
         or new.internal_risk  is distinct from old.internal_risk
         or new.featured       is distinct from old.featured
         or new.visibility     is distinct from old.visibility
         or new.agent_id       is distinct from old.agent_id then
        raise exception 'Not allowed: only an admin can change approval fields';
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists hot_deals_guard on public.hot_resale_deals;
create trigger hot_deals_guard before insert or update on public.hot_resale_deals
  for each row execute function public.guard_hot_deal();

-- Notify fan-out (SECURITY DEFINER so it works across RLS boundaries):
--   new pending -> all admins ; approved -> all staff ; rejected/correction -> submitter.
create or replace function public.notify_hot_deal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' and new.status = 'Pending Approval' then
    insert into public.notifications (user_id, kind, title, body, link_screen)
    select p.id, 'hot_deal_pending', 'Hot deal pending approval',
           coalesce(new.agent_name,'An agent') || ' submitted: ' || new.project_name, 'hotdeals'
    from public.profiles p where p.role in ('master_admin','admin') and p.active is not false;
  elsif TG_OP = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'Approved' then
      insert into public.notifications (user_id, kind, title, body, link_screen)
      select p.id, 'hot_deal_approved', 'New hot resale deal',
             new.project_name || ' in ' || coalesce(new.area,'Dubai') ||
             case when new.price is not null then ' — ' || new.price else '' end, 'hotdeals'
      from public.profiles p where p.role in ('agent','sales_manager','admin','master_admin') and p.active is not false;
    elsif new.status = 'Rejected' then
      insert into public.notifications (user_id, kind, title, body, link_screen)
      values (new.agent_id, 'hot_deal_rejected', 'Hot deal not approved',
              new.project_name || coalesce(' — ' || new.approval_notes, ''), 'hotdeals');
    elsif new.status = 'Needs Correction' then
      insert into public.notifications (user_id, kind, title, body, link_screen)
      values (new.agent_id, 'hot_deal_correction', 'Hot deal needs correction',
              new.project_name || coalesce(' — ' || new.approval_notes, ''), 'hotdeals');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists hot_deals_notify on public.hot_resale_deals;
create trigger hot_deals_notify after insert or update on public.hot_resale_deals
  for each row execute function public.notify_hot_deal();
-- =====================================================================
-- DONE.
-- =====================================================================
