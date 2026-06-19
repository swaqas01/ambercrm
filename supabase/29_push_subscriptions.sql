-- 29_push_subscriptions.sql
-- Stores Web Push subscriptions so the server can notify an agent's phone (e.g. a lead assigned to them).
-- Each opted-in device = one row. The push SENDER (api/notify) uses the service role, which bypasses RLS;
-- these policies govern the browser client so each agent manages only their own devices.
-- Purely additive — no existing object or data is touched. "if not exists" makes it safe to re-run.

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- An agent registers only their own device subscriptions.
drop policy if exists push_sub_insert on public.push_subscriptions;
create policy push_sub_insert on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());

-- An agent reads their own; Master Admin can read all (for support/debugging).
drop policy if exists push_sub_select on public.push_subscriptions;
create policy push_sub_select on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_master());

-- An agent can refresh (upsert) their own subscription rows.
drop policy if exists push_sub_update on public.push_subscriptions;
create policy push_sub_update on public.push_subscriptions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- An agent can remove their own device.
drop policy if exists push_sub_delete on public.push_subscriptions;
create policy push_sub_delete on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

create index if not exists idx_push_sub_user on public.push_subscriptions (user_id);
