-- =====================================================================
-- Amber Lead Desk — Migration 05: lead comments + sequential lead numbers
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- =====================================================================

-- 1) Sequential, human-friendly lead numbers (L001, L002 …) WITHOUT touching existing lead_code.
--    A separate column + sequence so old codes keep working.
create sequence if not exists public.lead_seq;
alter table public.leads add column if not exists lead_no integer;

-- backfill existing leads in creation order (only those missing a number)
do $$
declare r record;
begin
  for r in (select id from public.leads where lead_no is null order by created_at) loop
    update public.leads set lead_no = nextval('public.lead_seq') where id = r.id;
  end loop;
end $$;

-- new leads get the next number automatically
create or replace function public.set_lead_no() returns trigger language plpgsql as $$
begin
  if new.lead_no is null then new.lead_no := nextval('public.lead_seq'); end if;
  return new;
end $$;
drop trigger if exists leads_set_no on public.leads;
create trigger leads_set_no before insert on public.leads
  for each row execute function public.set_lead_no();

-- 2) Comments (soft-delete, RLS-scoped the same way leads are)
create table if not exists public.lead_comments (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  author_id  uuid references public.profiles(id),
  body       text not null,
  deleted    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lead_comments_lead_idx on public.lead_comments(lead_id);
alter table public.lead_comments enable row level security;

-- can read comments on a lead you can read (admins all; agents their own/open) — mirror the leads visibility
drop policy if exists lead_comments_select on public.lead_comments;
create policy lead_comments_select on public.lead_comments for select using (
  public.is_admin() or exists (
    select 1 from public.leads l where l.id = lead_id
    and (l.assigned_agent = auth.uid() or l.current_owner = auth.uid() or l.created_by = auth.uid() or l.is_open = true)
  )
);
-- can comment on a lead you can access; author must be you
drop policy if exists lead_comments_insert on public.lead_comments;
create policy lead_comments_insert on public.lead_comments for insert with check (
  author_id = auth.uid() and (
    public.is_admin() or exists (
      select 1 from public.leads l where l.id = lead_id
      and (l.assigned_agent = auth.uid() or l.current_owner = auth.uid() or l.created_by = auth.uid() or l.is_open = true)
    )
  )
);
-- can edit/soft-delete your own comment; admins can moderate any
drop policy if exists lead_comments_update on public.lead_comments;
create policy lead_comments_update on public.lead_comments for update using (
  author_id = auth.uid() or public.is_admin()
) with check (author_id = auth.uid() or public.is_admin());

-- =====================================================================
-- DONE.
-- =====================================================================
