-- 34_agent_targets.sql
-- Daily/weekly/monthly CALL and WHATSAPP targets per agent, plus company defaults + an audit log.
-- SAFE & IDEMPOTENT. Deletes nothing. Weakens no existing RLS. Counts are computed at read time
-- from the existing lead_activity logs (action 'call' / 'whatsapp') — no activity data is duplicated.

-- 1) Company-wide default targets (single row, id = 1) -----------------------------------
create table if not exists public.default_agent_targets (
  id                      int primary key default 1,
  daily_call_target       int not null default 20,
  weekly_call_target      int not null default 100,
  monthly_call_target     int not null default 400,
  daily_whatsapp_target   int not null default 30,
  weekly_whatsapp_target  int not null default 150,
  monthly_whatsapp_target int not null default 600,
  updated_by              uuid references public.profiles(id),
  updated_at              timestamptz not null default now(),
  constraint default_agent_targets_singleton check (id = 1)
);
insert into public.default_agent_targets (id) values (1) on conflict (id) do nothing;

-- 2) Per-agent overrides (NULL column => fall back to the company default) ---------------
create table if not exists public.agent_targets (
  agent_id                uuid primary key references public.profiles(id) on delete cascade,
  daily_call_target       int,
  weekly_call_target      int,
  monthly_call_target     int,
  daily_whatsapp_target   int,
  weekly_whatsapp_target  int,
  monthly_whatsapp_target int,
  is_active               boolean not null default true,
  created_by              uuid references public.profiles(id),
  updated_by              uuid references public.profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 3) Optional audit log ------------------------------------------------------------------
create table if not exists public.target_history (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid references public.profiles(id) on delete cascade,
  target_type text,
  old_value   jsonb,
  new_value   jsonb,
  changed_by  uuid references public.profiles(id),
  changed_at  timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.targets_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists default_targets_touch_trg on public.default_agent_targets;
create trigger default_targets_touch_trg before update on public.default_agent_targets
  for each row execute function public.targets_touch();
drop trigger if exists agent_targets_touch_trg on public.agent_targets;
create trigger agent_targets_touch_trg before update on public.agent_targets
  for each row execute function public.targets_touch();

-- 4) RLS ---------------------------------------------------------------------------------
alter table public.default_agent_targets enable row level security;
alter table public.agent_targets         enable row level security;
alter table public.target_history         enable row level security;

-- Defaults: any signed-in user may READ (agents need them to see their goal); only Master Admin writes.
drop policy if exists default_targets_read on public.default_agent_targets;
create policy default_targets_read on public.default_agent_targets for select to authenticated using ( true );
drop policy if exists default_targets_write on public.default_agent_targets;
create policy default_targets_write on public.default_agent_targets for all
  using ( public.is_master() ) with check ( public.is_master() );

-- Agent targets: an agent reads ONLY their own; admins/master read all; ONLY Master Admin writes.
drop policy if exists agent_targets_read on public.agent_targets;
create policy agent_targets_read on public.agent_targets for select
  using ( agent_id = auth.uid() or public.is_admin() );
drop policy if exists agent_targets_write on public.agent_targets;
create policy agent_targets_write on public.agent_targets for all
  using ( public.is_master() ) with check ( public.is_master() );

-- History: admins read; Master Admin writes.
drop policy if exists target_history_read on public.target_history;
create policy target_history_read on public.target_history for select using ( public.is_admin() );
drop policy if exists target_history_write on public.target_history;
create policy target_history_write on public.target_history for insert with check ( public.is_master() );

-- Verify:
-- select * from public.default_agent_targets;
-- select policyname from pg_policies where tablename in ('agent_targets','default_agent_targets');
