-- =====================================================================
-- Amber Lead Desk — Migration 11: reliable auth (password rules, 2FA, audit)
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- =====================================================================

-- 1) Password-lifecycle + 2FA flags on the profile.
alter table public.profiles add column if not exists first_login              boolean default true;
alter table public.profiles add column if not exists twofa_required           boolean default false;
alter table public.profiles add column if not exists password_last_changed_at timestamptz;
alter table public.profiles add column if not exists password_expires_at      timestamptz;

-- Existing people are already onboarded — don't force them through "first login".
update public.profiles set first_login = false
  where first_login is true and (last_login is not null or force_password_change = false);

-- 2FA is mandatory for agents (spec). Master Admin is left opt-in so the owner can
-- never be locked out by an email-delivery problem; they can enable it from Users.
update public.profiles set twofa_required = true where role = 'agent' and twofa_required is distinct from true;

-- 2) Authentication audit log (Master Admin reviews this).
create table if not exists public.auth_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  email       text,
  event       text not null,     -- login_attempt | login_success | login_failed | account_inactive | 2fa_sent | 2fa_success | 2fa_failed | 2fa_expired | password_changed | password_expired | forgot_requested | reset_used | reset_success | reset_failed | admin_reset | forced_change | account_locked
  status      text,              -- ok | fail | info
  reason      text,
  ip          text,
  device      text,
  created_at  timestamptz not null default now()
);
create index if not exists auth_logs_idx on public.auth_logs(created_at);
create index if not exists auth_logs_email_idx on public.auth_logs(email, created_at);
alter table public.auth_logs enable row level security;
-- Admins read; anyone authenticated may append (append-only telemetry); server (service role) bypasses RLS.
drop policy if exists auth_logs_select on public.auth_logs;
create policy auth_logs_select on public.auth_logs for select using ( public.is_admin() );
drop policy if exists auth_logs_insert on public.auth_logs;
create policy auth_logs_insert on public.auth_logs for insert with check ( true );

-- 3) One-time 2FA codes. Server-only: RLS on with NO policies => no anon/auth access;
--    the service role key (used only in /api/auth) bypasses RLS to read/write these.
create table if not exists public.auth_otp (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  email       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists auth_otp_email_idx on public.auth_otp(email, created_at);
alter table public.auth_otp enable row level security;
-- (intentionally no policies)
-- =====================================================================
-- DONE.
-- =====================================================================
