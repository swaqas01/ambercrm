-- =====================================================================
-- Amber Lead Desk — Migration 09: extend Ask Amber logs for Master Admin review
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- =====================================================================
alter table public.ai_logs add column if not exists user_email      text;
alter table public.ai_logs add column if not exists full_response    text;
alter table public.ai_logs add column if not exists category         text;     -- crm | dubai_re | sales | follow_up | project | drafting | inappropriate | non_work | personal | sexual | other
alter table public.ai_logs add column if not exists inappropriate    boolean default false;
alter table public.ai_logs add column if not exists non_work         boolean default false;
alter table public.ai_logs add column if not exists refusal_reason   text;
alter table public.ai_logs add column if not exists denied_reason    text;
alter table public.ai_logs add column if not exists device           text;
alter table public.ai_logs add column if not exists tokens_in        integer;
alter table public.ai_logs add column if not exists tokens_out       integer;

create index if not exists ai_logs_cat_idx on public.ai_logs(category, created_at);
-- =====================================================================
-- DONE.
-- =====================================================================
