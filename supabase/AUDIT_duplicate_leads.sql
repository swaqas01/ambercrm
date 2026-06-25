-- AUDIT_duplicate_leads.sql
-- READ-ONLY. Deletes nothing, changes nothing. Run in Supabase -> SQL Editor, paste results back.
-- Finds duplicate leads by normalized phone (and by email), so we can review the Kevin case and
-- the wider duplicate situation before deciding on any constraint or cleanup.

-- ============ QUERY 1 — the Kevin example (same number, +447949718111) ============
select
  id as lead_id, lead_code, client_name, phone, normalized_phone, email, project,
  assigned_agent_name, status, temperature, is_open,
  to_char(created_at at time zone 'Asia/Dubai', 'YYYY-MM-DD HH24:MI') as created_dubai,
  to_char(last_contacted_at at time zone 'Asia/Dubai', 'YYYY-MM-DD HH24:MI') as last_contact_dubai
from public.leads
where deleted is not true
  and (normalized_phone = public.normalize_phone('+447949718111')
       or client_name ilike '%kevin%')
order by created_at;


-- ============ QUERY 2 — ALL duplicate phone numbers (2+ active leads sharing a number) ============
-- Top of the list = worst offenders. Shows how many copies and which agents/projects hold them.
select
  normalized_phone,
  count(*) as copies,
  array_agg(lead_code order by created_at) as lead_codes,
  array_agg(distinct client_name) as names,
  array_agg(distinct coalesce(assigned_agent_name, '(open/unassigned)')) as agents,
  array_agg(distinct coalesce(project, '(no project)')) as projects,
  to_char(min(created_at) at time zone 'Asia/Dubai', 'YYYY-MM-DD') as first_created,
  to_char(max(created_at) at time zone 'Asia/Dubai', 'YYYY-MM-DD') as last_created
from public.leads
where deleted is not true and normalized_phone is not null
group by normalized_phone
having count(*) > 1
order by copies desc, last_created desc
limit 200;


-- ============ QUERY 3 — duplicate emails (2+ active leads sharing a real email) ============
select
  lower(email) as email_norm,
  count(*) as copies,
  array_agg(lead_code order by created_at) as lead_codes,
  array_agg(distinct client_name) as names,
  array_agg(distinct coalesce(assigned_agent_name, '(open/unassigned)')) as agents
from public.leads
where deleted is not true and email is not null and email <> '' and email ilike '%@%'
group by lower(email)
having count(*) > 1
order by copies desc
limit 200;


-- ============ QUERY 4 — headline counts (how big is the problem) ============
select
  (select count(*) from public.leads where deleted is not true) as active_leads,
  (select count(*) from (
     select normalized_phone from public.leads
     where deleted is not true and normalized_phone is not null
     group by normalized_phone having count(*) > 1) d) as phone_numbers_with_dupes,
  (select coalesce(sum(c) - count(*), 0) from (
     select count(*) as c from public.leads
     where deleted is not true and normalized_phone is not null
     group by normalized_phone having count(*) > 1) d2) as extra_phone_dupe_rows;
