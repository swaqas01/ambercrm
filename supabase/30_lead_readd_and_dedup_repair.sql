-- 30_lead_readd_and_dedup_repair.sql
-- Two things, both SAFE & IDEMPOTENT (no rows deleted or merged):
--   1) Repair + harden duplicate-by-phone detection so it reliably catches numbers on IMPORTED leads
--      (re-backfills normalized_phone; adds a last-9-digits fallback match for format variants).
--   2) Add readd_lead(): "re-add" an existing lead — archive its current enquiry into the lead's notes,
--      then replace the enquiry fields with the new details, and resurface it as a fresh New/Hot lead.
-- Self-contained: re-creates the normalizer/column/trigger in case migration 22 was never applied.

-- ---------- 1) Phone normalization (mirrors the app's toE164 for common cases) ----------
create or replace function public.normalize_phone(p text)
returns text language plpgsql immutable as $$
declare d text;
begin
  if p is null then return null; end if;
  d := regexp_replace(p, '[^0-9+]', '', 'g');
  if d = '' or d = '+' then return null; end if;
  if left(d, 2) = '00' then d := '+' || substring(d from 3); end if;
  if left(d, 1) <> '+' then
    d := regexp_replace(d, '[^0-9]', '', 'g');
    if d ~ '^0[0-9]{9}$' then d := '+971' || substring(d from 2);
    elsif d ~ '^5[0-9]{8}$' then d := '+971' || d;
    elsif left(d, 1) = '0' then d := '+' || substring(d from 2);
    else d := '+' || d;
    end if;
  else
    d := '+' || regexp_replace(substring(d from 2), '[^0-9]', '', 'g');
  end if;
  return d;
end $$;

alter table public.leads add column if not exists normalized_phone text;

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

-- Re-backfill: fixes any imported rows whose normalized_phone is null or stale. Idempotent.
update public.leads
  set normalized_phone = public.normalize_phone(phone)
  where phone is not null
    and (normalized_phone is null or normalized_phone is distinct from public.normalize_phone(phone));

create index if not exists idx_leads_normalized_phone
  on public.leads (normalized_phone) where normalized_phone is not null;

-- ---------- 2) Hardened duplicate-check RPC (adds last-9-digits fallback) ----------
create or replace function public.check_duplicate_phone(p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_norm text; v_d9 text; v_lead public.leads%rowtype; v_mine boolean; v_admin boolean;
begin
  v_norm := public.normalize_phone(p_phone);
  if v_norm is null or length(regexp_replace(v_norm, '[^0-9]', '', 'g')) < 8 then
    return jsonb_build_object('exists', false);
  end if;
  v_d9 := right(regexp_replace(v_norm, '[^0-9]', '', 'g'), 9);
  select * into v_lead from public.leads
    where deleted is not true and (
      normalized_phone = v_norm
      or phone = v_norm
      or (length(regexp_replace(coalesce(normalized_phone, phone), '[^0-9]', '', 'g')) >= 9
          and right(regexp_replace(coalesce(normalized_phone, phone), '[^0-9]', '', 'g'), 9) = v_d9))
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

-- ---------- 3) readd_lead(): archive old enquiry to notes, replace with new, resurface as New/Hot ----------
create or replace function public.readd_lead(p_lead_id uuid, p_new jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lead public.leads%rowtype; v_admin boolean; v_mine boolean; v_uid uuid; v_old text;
begin
  v_uid := auth.uid();
  select * into v_lead from public.leads where id = p_lead_id and deleted is not true;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  v_admin := public.is_admin();
  v_mine  := (v_lead.assigned_agent = v_uid or v_lead.current_owner = v_uid or v_lead.created_by = v_uid);
  if not (v_admin or v_mine) then return jsonb_build_object('ok', false, 'error', 'not_permitted'); end if;

  -- a) snapshot the CURRENT enquiry into a comment (history)
  v_old := 'Lead re-added — previous enquiry archived:'
    || E'\n• Project: '       || coalesce(v_lead.project, '—')
    || E'\n• Area: '          || coalesce(v_lead.area, '—')
    || E'\n• Budget: '        || coalesce(v_lead.budget, '—')
    || E'\n• Property type: ' || coalesce(v_lead.property_type, '—')
    || E'\n• Purpose: '       || coalesce(v_lead.purpose, '—')
    || E'\n• Ready/Off-plan: '|| coalesce(v_lead.ready_offplan, '—')
    || E'\n• Lead type: '     || coalesce(v_lead.lead_type, '—')
    || E'\n• Status was: '    || coalesce(v_lead.status, '—');
  insert into public.lead_comments (lead_id, author_id, body) values (p_lead_id, v_uid, v_old);

  -- b) replace enquiry fields with the new details (only where a new value was provided)
  update public.leads set
    project       = coalesce(nullif(p_new->>'project',''),       project),
    area          = coalesce(nullif(p_new->>'area',''),          area),
    budget        = coalesce(nullif(p_new->>'budget',''),        budget),
    property_type = coalesce(nullif(p_new->>'property_type',''), property_type),
    purpose       = coalesce(nullif(p_new->>'purpose',''),       purpose),
    ready_offplan = coalesce(nullif(p_new->>'ready_offplan',''), ready_offplan),
    lead_type     = coalesce(nullif(p_new->>'lead_type',''),     lead_type),
    nationality   = coalesce(nullif(p_new->>'nationality',''),   nationality),
    status        = 'New',
    temperature   = 'Hot',
    last_contacted = now()
  where id = p_lead_id;

  -- c) optional new enquiry note as its own comment
  if coalesce(nullif(p_new->>'followup_note',''), '') <> '' then
    insert into public.lead_comments (lead_id, author_id, body)
      values (p_lead_id, v_uid, 'New enquiry note: ' || (p_new->>'followup_note'));
  end if;

  -- d) activity log
  insert into public.lead_activity (lead_id, actor_id, action, detail)
    values (p_lead_id, v_uid, 'lead_readded', jsonb_build_object('new_project', p_new->>'project', 'new_area', p_new->>'area'));

  return jsonb_build_object('ok', true, 'lead_id', p_lead_id);
end $$;
grant execute on function public.readd_lead(uuid, jsonb) to authenticated;
