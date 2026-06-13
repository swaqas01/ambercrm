-- =====================================================================
-- Amber Lead Desk — Migration 03: fix Leads Live + notifications
-- Safe & idempotent. Run in Supabase → SQL Editor. Adds nothing destructive.
-- =====================================================================

-- 1) FIX "column assigned_agent_name does not exist"
--    These columns belong on leads; ensure they exist even if 02 wasn't run.
alter table public.leads add column if not exists assigned_agent_name text;
alter table public.leads add column if not exists transaction_type   text;
alter table public.leads add column if not exists created_on          date;
alter table public.leads add column if not exists property_type       text;
alter table public.leads add column if not exists purpose             text;
alter table public.leads add column if not exists nationality         text;
alter table public.leads add column if not exists ready_offplan       text;
alter table public.leads add column if not exists followup_note       text;

-- 2) NOTIFICATIONS
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,  -- recipient; null = broadcast to admins
  kind        text not null,            -- 'lead_assigned','lead_open','followup_overdue','security','deal','document','ai','system'
  title       text not null,
  body        text,
  link_screen text,                     -- e.g. 'live','security'
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id, read);

alter table public.notifications enable row level security;

-- recipient (or any admin for broadcast rows) can read
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select using (
  user_id = auth.uid() or (user_id is null and public.is_admin())
);
-- recipient can mark their own read/unread; admins can update broadcast rows
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update using (
  user_id = auth.uid() or (user_id is null and public.is_admin())
) with check (
  user_id = auth.uid() or (user_id is null and public.is_admin())
);
-- any authenticated user/system may insert notifications
drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications for insert with check ( auth.role() = 'authenticated' );

-- 3) Seed a few starter notifications for admins (only if table is empty)
insert into public.notifications (user_id, kind, title, body, link_screen)
select null, 'system', 'Welcome to Amber Lead Desk', 'Your CRM is live. Import leads and create agent accounts to get started.', 'live'
where not exists (select 1 from public.notifications);

-- =====================================================================
-- DONE.
-- =====================================================================
