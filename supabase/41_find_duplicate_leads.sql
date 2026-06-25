-- 41_find_duplicate_leads.sql
-- Amber Homes — reliable duplicate-lead finder for the "Scan for duplicates" tool.
-- WHY: the old scan fetched all leads to the browser and re-normalized phones in JavaScript, which
-- (a) can hit the API row cap and silently miss rows, and (b) uses a different normalization than the
-- database, so genuine duplicates (stored in slightly different raw formats) were missed. This function
-- detects duplicates in SQL using the authoritative normalized_phone column (same basis as the audit),
-- so the scan matches reality. Master-Admin only. READ-ONLY — selects, never writes.

create or replace function public.find_duplicate_leads()
returns table (
  group_key text, kind text, lead_id uuid, client_name text, phone text, email text,
  assigned_agent_name text, status text, temperature text, is_open boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  -- Phone duplicates: leads whose normalized_phone is shared by 2+ active leads
  select l.normalized_phone as group_key, 'phone'::text as kind, l.id, l.client_name, l.phone, l.email,
         l.assigned_agent_name, l.status, l.temperature, l.is_open, l.created_at
  from public.leads l
  join (
    select normalized_phone
    from public.leads
    where deleted is not true and normalized_phone is not null
    group by normalized_phone having count(*) > 1
  ) d on d.normalized_phone = l.normalized_phone
  where l.deleted is not true and public.is_master()

  union all

  -- Email duplicates: leads whose lower(email) is shared by 2+ active leads
  select lower(l.email) as group_key, 'email'::text as kind, l.id, l.client_name, l.phone, l.email,
         l.assigned_agent_name, l.status, l.temperature, l.is_open, l.created_at
  from public.leads l
  join (
    select lower(email) as em
    from public.leads
    where deleted is not true and email is not null and email <> '' and email ilike '%@%'
    group by lower(email) having count(*) > 1
  ) d2 on d2.em = lower(l.email)
  where l.deleted is not true and public.is_master()

  order by group_key, created_at;
$$;

revoke all on function public.find_duplicate_leads() from public;
grant execute on function public.find_duplicate_leads() to authenticated;
