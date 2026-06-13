-- =====================================================================
-- Amber Lead Desk — Migration 04: user/agent management
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- NOTE: enum additions are committed first (Postgres requires this before use).
-- =====================================================================

-- 1) New roles (safe; existing roles untouched)
alter type user_role add value if not exists 'sales_manager';
alter type user_role add value if not exists 'marketing';
alter type user_role add value if not exists 'accounts';

-- 2) New profile fields for user management
alter table public.profiles add column if not exists phone                 text;
alter table public.profiles add column if not exists department            text;
alter table public.profiles add column if not exists job_title             text;
alter table public.profiles add column if not exists lead_scope            text default 'own';   -- own | team | all
alter table public.profiles add column if not exists notes                 text;
alter table public.profiles add column if not exists created_by            uuid references public.profiles(id);
alter table public.profiles add column if not exists force_password_change  boolean default false;
alter table public.profiles add column if not exists twofa_required         boolean default false;
alter table public.profiles add column if not exists last_login            timestamptz;
alter table public.profiles add column if not exists deactivated_at        timestamptz;
alter table public.profiles add column if not exists deactivated_by        uuid references public.profiles(id);
alter table public.profiles add column if not exists deactivation_reason   text;

-- 3) Admin-management audit log (separate from lead activity)
create table if not exists public.admin_audit (
  id           uuid primary key default gen_random_uuid(),
  action       text not null,           -- user_created, user_edited, role_changed, password_reset, user_deactivated, user_reactivated, leads_moved, leads_reassigned
  performed_by uuid references public.profiles(id),
  affected_user uuid references public.profiles(id),
  old_value    jsonb,
  new_value    jsonb,
  detail       text,
  created_at   timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
drop policy if exists admin_audit_select on public.admin_audit;
create policy admin_audit_select on public.admin_audit for select using ( public.is_admin() );
drop policy if exists admin_audit_insert on public.admin_audit;
create policy admin_audit_insert on public.admin_audit for insert with check ( auth.role() = 'authenticated' );

-- 4) Allow admins to read all profiles (needed for the Users list)
--    (existing policy already allows self + is_admin; ensure it's present)
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles for select
  using ( id = auth.uid() or public.is_admin() );

-- =====================================================================
-- DONE.
-- =====================================================================
