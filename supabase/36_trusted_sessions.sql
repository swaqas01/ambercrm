-- =====================================================================
-- Amber CRM — Migration 36: 7-day trusted device sessions (post-2FA)
-- Additive & idempotent. Backs "stay logged in 7 days, max 2 devices, no
-- random 2FA". The SERVER (service role) writes these rows; the browser may
-- READ its own (admins read all) for the security panel. No raw tokens are
-- stored — only SHA-256 hashes of the device id and the per-session trust token.
-- =====================================================================
create table if not exists public.user_device_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  device_id_hash       text not null,
  session_id_hash      text not null,
  device_label         text,
  browser              text,
  os                   text,
  ip_address           text,
  user_agent           text,
  created_at           timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  last_2fa_verified_at timestamptz,
  trusted_until        timestamptz,
  revoked_at           timestamptz,
  revoked_reason       text,
  is_active            boolean not null default true
);

create unique index if not exists uds_user_device  on public.user_device_sessions (user_id, device_id_hash);
create index        if not exists uds_user_created on public.user_device_sessions (user_id, created_at);
create index        if not exists uds_user_active  on public.user_device_sessions (user_id) where is_active = true and revoked_at is null;

alter table public.user_device_sessions enable row level security;

-- Read: a user sees their own sessions; admins/master see all (Master-Admin session panel).
drop policy if exists uds_select on public.user_device_sessions;
create policy uds_select on public.user_device_sessions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- No insert/update/delete policies: rows are written ONLY by the server (service role,
-- which bypasses RLS). The browser can never forge or alter a trusted session.
-- =====================================================================
-- DONE.
-- =====================================================================
