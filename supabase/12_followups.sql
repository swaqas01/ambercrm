-- =====================================================================
-- Amber Lead Desk — Migration 12: follow-ups (date+time+type+comment),
-- precise last-contact, tighter agent field lock, assigned-agent name sync.
-- Safe & idempotent.
-- =====================================================================

-- 1) Precise timestamps on the lead (keep legacy date columns in sync for old views).
alter table public.leads add column if not exists next_followup_at  timestamptz;
alter table public.leads add column if not exists last_contacted_at timestamptz;
alter table public.leads add column if not exists last_contacted_by uuid references public.profiles(id);

-- 2) Follow-ups: a real schedulable item with time, type, comment, outcome.
create table if not exists public.follow_ups (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  agent_id        uuid references public.profiles(id),     -- who it's for (current assigned agent)
  created_by      uuid references public.profiles(id),
  due_at          timestamptz not null,
  type            text not null default 'Call',            -- Call | WhatsApp | Meeting | Site Visit | Zoom | Email | Other
  comment         text,
  priority        text default 'Normal',                   -- Normal | High | Urgent
  reminder        text default 'at_time',                  -- at_time | 15m | 30m | 1h | 1d
  status          text not null default 'scheduled',       -- scheduled | completed | cancelled
  outcome         text,
  outcome_comment text,
  notified        boolean not null default false,          -- dashboard has surfaced the "due" alert
  completed_at    timestamptz,
  completed_by    uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists follow_ups_lead_idx  on public.follow_ups(lead_id);
create index if not exists follow_ups_agent_idx on public.follow_ups(agent_id, due_at);
create index if not exists follow_ups_due_idx   on public.follow_ups(due_at) where status = 'scheduled';

drop trigger if exists follow_ups_touch on public.follow_ups;
create trigger follow_ups_touch before update on public.follow_ups
  for each row execute function public.touch_updated_at();

alter table public.follow_ups enable row level security;
-- Visible/editable to admins, and to the agent who the lead is theirs (assigned/owner/creator) or that they created the follow-up.
drop policy if exists follow_ups_select on public.follow_ups;
create policy follow_ups_select on public.follow_ups for select using (
  public.is_admin()
  or created_by = auth.uid()
  or exists ( select 1 from public.leads l where l.id = lead_id and (
        l.assigned_agent = auth.uid() or l.current_owner = auth.uid() or l.created_by = auth.uid() or l.is_open = true ) )
);
drop policy if exists follow_ups_insert on public.follow_ups;
create policy follow_ups_insert on public.follow_ups for insert with check (
  public.is_admin()
  or ( created_by = auth.uid() and exists ( select 1 from public.leads l where l.id = lead_id and (
        l.assigned_agent = auth.uid() or l.current_owner = auth.uid() or l.created_by = auth.uid() or l.is_open = true ) ) )
);
drop policy if exists follow_ups_update on public.follow_ups;
create policy follow_ups_update on public.follow_ups for update using (
  public.is_admin()
  or created_by = auth.uid()
  or exists ( select 1 from public.leads l where l.id = lead_id and (
        l.assigned_agent = auth.uid() or l.current_owner = auth.uid() or l.created_by = auth.uid() ) )
) with check (
  public.is_admin()
  or created_by = auth.uid()
  or exists ( select 1 from public.leads l where l.id = lead_id and (
        l.assigned_agent = auth.uid() or l.current_owner = auth.uid() or l.created_by = auth.uid() ) )
);
-- no delete policy: follow-ups are cancelled (status), not destroyed.

-- 3) Backend field lock: agents may NOT change identity/contact/source/ownership.
--    (Frontend also hides these, but the DB is the real guard.)
create or replace function public.guard_protected_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.assigned_agent  is distinct from old.assigned_agent
       or new.current_owner   is distinct from old.current_owner
       or new.original_agent  is distinct from old.original_agent
       or new.created_by      is distinct from old.created_by
       or new.source          is distinct from old.source
       or new.deleted         is distinct from old.deleted
       or new.client_name     is distinct from old.client_name
       or new.phone           is distinct from old.phone
       or new.whatsapp        is distinct from old.whatsapp
       or new.email           is distinct from old.email then
      raise exception 'Not allowed: protected fields can only be changed by an admin';
    end if;
  end if;
  return new;
end $$;
-- trigger already exists from 01; function is replaced in place.

-- 4) Correct the displayed agent: sync the denormalised name to the authoritative uuid.
--    This fixes leads where assigned_agent_name (text) drifted from assigned_agent (uuid).
update public.leads l set assigned_agent_name = p.full_name
  from public.profiles p
  where l.assigned_agent = p.id
    and l.assigned_agent_name is distinct from p.full_name;
-- =====================================================================
-- DONE.
-- =====================================================================
