-- 22_phone_dedup.sql
-- Amber Homes — phone normalization + duplicate fail-safe.
-- SAFE & IDEMPOTENT: adds a column, helper functions, a maintenance trigger, an index and a
-- duplicate-check RPC. It does NOT delete or merge any leads and does NOT add a hard unique index
-- (that is left commented at the bottom, to run only AFTER you have resolved existing duplicates).
-- HOW TO RUN: Supabase -> SQL Editor -> paste -> Run.
--
-- NOTE: the agent phone/WhatsApp EDIT lock is already enforced by public.guard_protected_columns()
-- (migration 12): a non-admin who tries to change phone/whatsapp/client_name/email/source is rejected
-- at the database. This migration adds the DUPLICATE protection layer on top of that.

-- 1) Server-side normalizer to E.164 (best-effort; mirrors the app's toE164 for the common cases).
create or replace function public.normalize_phone(p text)
returns text language plpgsql immutable as $$
declare d text;
begin
  if p is null then return null; end if;
  d := regexp_replace(p, '[^0-9+]', '', 'g');                 -- keep digits and a leading +
  if d = '' or d = '+' then return null; end if;
  if left(d, 2) = '00' then
    d := '+' || substring(d from 3);
  end if;
  if left(d, 1) <> '+' then
    d := regexp_replace(d, '[^0-9]', '', 'g');
    if d ~ '^0[0-9]{9}$' then d := '+971' || substring(d from 2);   -- UAE local 05XXXXXXXX
    elsif d ~ '^5[0-9]{8}$' then d := '+971' || d;                   -- UAE 5XXXXXXXX
    elsif left(d, 1) = '0' then d := '+' || substring(d from 2);     -- strip a lone trunk zero
    else d := '+' || d;
    end if;
  else
    d := '+' || regexp_replace(substring(d from 2), '[^0-9]', '', 'g');
  end if;
  return d;
end $$;

-- 2) Normalized-phone column for reliable duplicate detection.
alter table public.leads add column if not exists normalized_phone text;

-- 3) Keep normalized_phone in sync on insert and whenever phone changes.
create or replace function public.set_normalized_phone()
returns trigger language plpgsql as $$
begin
  new.normalized_phone := public.normalize_phone(new.phone);
  return new;
end $$;

drop trigger if exists trg_set_normalized_phone on public.leads;
create trigger trg_set_normalized_phone
  before insert or update of phone on public.leads
  for each row execute function public.set_normalized_phone();

-- 4) Backfill existing leads (does not touch the phone column, only the new normalized_phone).
update public.leads
  set normalized_phone = public.normalize_phone(phone)
  where phone is not null
    and normalized_phone is distinct from public.normalize_phone(phone);

-- 5) Fast lookup index (non-unique, so it never fails on existing duplicates).
create index if not exists idx_leads_normalized_phone
  on public.leads (normalized_phone) where normalized_phone is not null;

-- 6) Duplicate-check RPC. SECURITY DEFINER so an agent's check also detects numbers held by OTHER
--    agents (which RLS would otherwise hide) WITHOUT leaking those leads' details: when the match is
--    not the caller's own lead and the caller is not an admin, only { exists:true, mine:false } is returned.
create or replace function public.check_duplicate_phone(p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_norm text; v_lead public.leads%rowtype; v_mine boolean; v_admin boolean;
begin
  v_norm := public.normalize_phone(p_phone);
  if v_norm is null or length(regexp_replace(v_norm, '[^0-9]', '', 'g')) < 8 then
    return jsonb_build_object('exists', false);
  end if;
  select * into v_lead from public.leads
    where deleted is not true and (normalized_phone = v_norm or phone = v_norm)
    order by created_at asc limit 1;
  if not found then
    return jsonb_build_object('exists', false);
  end if;
  v_admin := public.is_admin();
  v_mine := (v_lead.assigned_agent = auth.uid() or v_lead.current_owner = auth.uid() or v_lead.created_by = auth.uid());
  if v_admin or v_mine then
    return jsonb_build_object(
      'exists', true, 'mine', v_mine, 'lead_id', v_lead.id, 'lead_code', v_lead.lead_code,
      'client_name', v_lead.client_name, 'assigned_agent_name', v_lead.assigned_agent_name,
      'status', v_lead.status, 'project', v_lead.project, 'area', v_lead.area, 'created_at', v_lead.created_at);
  else
    return jsonb_build_object('exists', true, 'mine', false);
  end if;
end $$;

grant execute on function public.check_duplicate_phone(text) to authenticated;

-- =====================================================================
-- OPTIONAL — HARD DATABASE-LEVEL DUPLICATE BLOCK (run later, by Master Admin)
-- =====================================================================
-- Step A: list existing duplicate numbers (resolve these first — do NOT delete blindly):
--   select normalized_phone, count(*) as n, array_agg(lead_code) as codes, array_agg(id) as ids
--     from public.leads
--     where deleted is not true and normalized_phone is not null
--     group by normalized_phone having count(*) > 1
--     order by n desc;
--
-- Step B: once no duplicates remain, enforce uniqueness at the database (cannot be bypassed):
--   create unique index concurrently leads_normalized_phone_uq
--     on public.leads (normalized_phone)
--     where normalized_phone is not null and deleted is not true;
-- =====================================================================
-- DONE.
-- =====================================================================
