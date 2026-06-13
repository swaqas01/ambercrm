-- =====================================================================
-- Amber Lead Desk — Database Schema v1 (Supabase / Postgres)
-- Run this ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- =====================================================================

-- ---------- roles ----------
do $$ begin
  create type user_role as enum ('master_admin','admin','agent');
exception when duplicate_object then null; end $$;

-- ---------- profiles (extends Supabase auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  role        user_role not null default 'agent',
  active      boolean   not null default true,
  created_at  timestamptz not null default now()
);

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- helper functions (used by security rules) ----------
create or replace function public.my_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('master_admin','admin') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'master_admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------- leads ----------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  lead_code        text unique,
  client_name      text not null,
  phone            text,
  whatsapp         text,
  email            text,
  nationality      text,
  country_residence text,
  language         text,
  budget           text,
  purpose          text,
  area             text,
  project          text,
  developer        text,
  property_type    text,
  bedrooms         text,
  ready_offplan    text,
  finance          text,
  timeline         text,
  source           text,
  campaign         text,
  temperature      text default 'Cold',
  status           text default 'New',
  call_outcome     text,
  assigned_agent   uuid references public.profiles(id),
  original_agent   uuid references public.profiles(id),
  current_owner    uuid references public.profiles(id),
  created_by       uuid references public.profiles(id),
  assigned_at      timestamptz,
  next_followup    date,
  last_contacted   date,
  notes            text,
  deal_value       numeric,
  commission_value numeric,
  is_open          boolean not null default false,
  opened_reason    text,
  opened_by        uuid references public.profiles(id),
  opened_at        timestamptz,
  opened_auto      boolean default false,
  deleted          boolean not null default false,   -- soft delete only
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists leads_assigned_idx on public.leads(assigned_agent);
create index if not exists leads_open_idx     on public.leads(is_open);
create index if not exists leads_status_idx   on public.leads(status);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- ANTI-THEFT: stop non-admins from changing ownership / source / creator.
-- An agent must never be able to reassign a lead to themselves or rewrite history.
create or replace function public.guard_protected_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.assigned_agent is distinct from old.assigned_agent
       or new.current_owner  is distinct from old.current_owner
       or new.original_agent is distinct from old.original_agent
       or new.created_by     is distinct from old.created_by
       or new.source         is distinct from old.source
       or new.deleted        is distinct from old.deleted then
      raise exception 'Not allowed: protected fields can only be changed by an admin';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists leads_guard on public.leads;
create trigger leads_guard before update on public.leads
  for each row execute function public.guard_protected_columns();

-- ---------- activity log (append-only audit trail) ----------
create table if not exists public.lead_activity (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.leads(id) on delete set null,
  actor_id    uuid references public.profiles(id),
  action      text not null,        -- e.g. 'view','reveal_phone','whatsapp_click','call_click','status_change','note','assign','make_open'
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists activity_lead_idx  on public.lead_activity(lead_id);
create index if not exists activity_actor_idx on public.lead_activity(actor_id);

-- ---------- ownership history ----------
create table if not exists public.lead_ownership_history (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.leads(id) on delete cascade,
  from_agent  uuid references public.profiles(id),
  to_agent    uuid references public.profiles(id),
  reason      text,
  changed_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- ROW-LEVEL SECURITY  — the core protection. Deny by default, then allow.
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.leads                  enable row level security;
alter table public.lead_activity          enable row level security;
alter table public.lead_ownership_history enable row level security;

-- profiles: you can read your own; admins read all; only master can change roles
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles for select
  using ( id = auth.uid() or public.is_admin() );
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for update
  using ( public.is_master() ) with check ( public.is_master() );

-- leads SELECT: an agent sees ONLY their own assigned / owned / created leads,
-- plus the shared open pool. Admins see everything. Soft-deleted hidden from agents.
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select using (
  public.is_admin()
  or ( deleted = false and (
        assigned_agent = auth.uid()
        or current_owner = auth.uid()
        or created_by = auth.uid()
        or is_open = true ) )
);

-- leads INSERT: admins anything; an agent may add their own lead (stamped to them)
drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert with check (
  public.is_admin()
  or ( created_by = auth.uid() and assigned_agent = auth.uid() )
);

-- leads UPDATE: admins anything; an agent may update a lead assigned to them
-- (the guard trigger above blocks them from touching ownership/source fields)
drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update using (
  public.is_admin() or assigned_agent = auth.uid() or current_owner = auth.uid()
) with check (
  public.is_admin() or assigned_agent = auth.uid() or current_owner = auth.uid()
);

-- leads DELETE: only master admin (and we prefer soft-delete in practice)
drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads for delete using ( public.is_master() );

-- activity: anyone authenticated logs their own actions; reads follow lead visibility
drop policy if exists activity_insert on public.lead_activity;
create policy activity_insert on public.lead_activity for insert with check ( actor_id = auth.uid() );
drop policy if exists activity_select on public.lead_activity;
create policy activity_select on public.lead_activity for select using (
  public.is_admin()
  or exists ( select 1 from public.leads l where l.id = lead_id and (
        l.assigned_agent = auth.uid() or l.current_owner = auth.uid()
        or l.created_by = auth.uid() or l.is_open = true ) )
);
-- (no update/delete policies => the audit log is immutable for everyone via the API)

-- ownership history: admins read all; agents read rows for leads they can see; insert by anyone authed
drop policy if exists ownership_select on public.lead_ownership_history;
create policy ownership_select on public.lead_ownership_history for select using (
  public.is_admin()
  or exists ( select 1 from public.leads l where l.id = lead_id and (
        l.assigned_agent = auth.uid() or l.current_owner = auth.uid() or l.created_by = auth.uid() ) )
);
drop policy if exists ownership_insert on public.lead_ownership_history;
create policy ownership_insert on public.lead_ownership_history for insert with check ( auth.role() = 'authenticated' );

-- =====================================================================
-- DONE. Next: create your Master Admin (see 02_first_admin.sql instructions).
-- =====================================================================
