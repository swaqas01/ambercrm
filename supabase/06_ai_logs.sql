-- =====================================================================
-- Amber Lead Desk — Migration 06: Ask Amber AI usage logs
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- =====================================================================
create table if not exists public.ai_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id),
  user_name     text,
  user_role     text,
  mentor_id     text,
  mentor_name   text,
  question      text,
  response_sum  text,
  model         text,
  status        text default 'success',   -- success | error | refused
  flagged       boolean default false,
  flag_category text,
  created_at    timestamptz not null default now()
);
create index if not exists ai_logs_user_idx on public.ai_logs(user_id, created_at);
create index if not exists ai_logs_flag_idx on public.ai_logs(flagged, created_at);

alter table public.ai_logs enable row level security;

-- user inserts own rows; admins read everything; users read their own
drop policy if exists ai_logs_insert on public.ai_logs;
create policy ai_logs_insert on public.ai_logs for insert with check ( user_id = auth.uid() );
drop policy if exists ai_logs_select on public.ai_logs;
create policy ai_logs_select on public.ai_logs for select using ( user_id = auth.uid() or public.is_admin() );

-- =====================================================================
-- DONE.
-- =====================================================================
