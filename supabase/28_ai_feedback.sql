-- 28_ai_feedback.sql
-- Answer-quality feedback for Ask Amber (the thumbs up / thumbs down on each AI reply).
-- Append-only log used to review what works and catch weak answers over time.
-- Purely additive — no existing table, policy or data is touched. "if not exists" makes it safe to re-run.

create table if not exists public.ai_feedback (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  mentor           text,
  rating           text not null check (rating in ('up','down')),
  question         text,
  response_summary text,
  comment          text,
  created_at       timestamptz not null default now()
);

alter table public.ai_feedback enable row level security;

-- A signed-in user may record their own feedback (and only tag it with their own id).
drop policy if exists ai_feedback_insert on public.ai_feedback;
create policy ai_feedback_insert on public.ai_feedback
  for insert to authenticated
  with check (user_id = auth.uid());

-- A user can read their own feedback; Master Admin can read everything (for the weekly review).
drop policy if exists ai_feedback_select on public.ai_feedback;
create policy ai_feedback_select on public.ai_feedback
  for select to authenticated
  using (user_id = auth.uid() or public.is_master());

create index if not exists idx_ai_feedback_created on public.ai_feedback (created_at desc);
create index if not exists idx_ai_feedback_rating  on public.ai_feedback (rating);
