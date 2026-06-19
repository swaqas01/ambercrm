-- 31_user_devices.sql
-- Device & session registry: lets an admin see each user's devices (device, IP, location, device-ID)
-- and is the basis for the max-2-devices cap. Purely additive & idempotent — no existing object touched.
-- The push/session SENDER (api/session-log) writes IP + geolocation via the service role (RLS-exempt);
-- these policies govern the browser client and the admin panel.

create table if not exists public.user_devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  device_id   text not null,                 -- stable, generated once per device (the MAC-equivalent identifier)
  label       text,                          -- friendly label parsed from the user agent
  user_agent  text,
  last_ip     text,
  city        text,
  region      text,
  country     text,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  revoked     boolean not null default false,
  revoked_at  timestamptz,
  revoked_by  uuid,
  unique (user_id, device_id)
);

alter table public.user_devices enable row level security;

-- A user sees their own devices; an admin/master sees everyone's (for the security panel).
drop policy if exists user_devices_select on public.user_devices;
create policy user_devices_select on public.user_devices
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- A user may register their own device.
drop policy if exists user_devices_insert on public.user_devices;
create policy user_devices_insert on public.user_devices
  for insert to authenticated
  with check (user_id = auth.uid());

-- A user may update their own device (heartbeat / self sign-out); an admin may update any (remote sign-out).
drop policy if exists user_devices_update on public.user_devices;
create policy user_devices_update on public.user_devices
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists idx_user_devices_user   on public.user_devices (user_id);
create index if not exists idx_user_devices_active on public.user_devices (user_id) where revoked = false;
