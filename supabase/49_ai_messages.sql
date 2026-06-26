-- 49_ai_messages.sql
-- Per-agent, per-mentor chat memory for Ask Amber.
-- Each row is one message in an agent's ongoing conversation with one AI mentor
-- (mentor_id = ambreen_ai | saad_ai | ibrahim_ai). Row-Level Security limits every
-- agent to ONLY their own messages — this is the safe, RLS-based way to isolate data
-- (the correct alternative to a SECURITY DEFINER view).
-- Purely additive and idempotent: touches no existing table and is safe to re-run.

create table if not exists public.ai_messages (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mentor_id   text not null,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  sources     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.ai_messages enable row level security;

-- A signed-in agent may write messages only as themselves.
drop policy if exists ai_messages_insert on public.ai_messages;
create policy ai_messages_insert on public.ai_messages
  for insert to authenticated
  with check (user_id = auth.uid());

-- An agent can read ONLY their own messages. Master Admin may read all (support / audit).
drop policy if exists ai_messages_select on public.ai_messages;
create policy ai_messages_select on public.ai_messages
  for select to authenticated
  using (user_id = auth.uid() or public.is_master());

-- An agent may clear (delete) only their own messages — powers the "New chat" button.
drop policy if exists ai_messages_delete on public.ai_messages;
create policy ai_messages_delete on public.ai_messages
  for delete to authenticated
  using (user_id = auth.uid());

-- Fast load of one agent's thread with one mentor, in order.
create index if not exists idx_ai_messages_user_mentor_time
  on public.ai_messages (user_id, mentor_id, created_at);
