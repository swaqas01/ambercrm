-- 33_cleanup_orphan_assignments.sql   (OPTIONAL — run only when you're ready)
-- Fixes legacy leads that show a typed agent name (e.g. "Sir Saad") for which NO real account exists.
-- It does NOT touch leads that are properly linked to an account (assigned_agent uuid), nor leads whose
-- typed name DOES match a real active account. It only blanks the orphan name so the lead reads
-- "Unassigned" and can be reassigned from the Lead Assignment screen. SAFE & IDEMPOTENT. Deletes no rows.
--
-- STEP 1 — PREVIEW FIRST (run this SELECT on its own and read the numbers before doing anything):
--   select count(*) as orphan_leads
--   from public.leads
--   where deleted is not true
--     and assigned_agent is null
--     and assigned_agent_name is not null
--     and btrim(assigned_agent_name) <> ''
--     and lower(btrim(assigned_agent_name)) not in (
--       select lower(btrim(full_name)) from public.profiles where active is not false and full_name is not null );
--   -- see the distinct phantom names:
--   select assigned_agent_name, count(*) from public.leads
--   where deleted is not true and assigned_agent is null and assigned_agent_name is not null
--     and lower(btrim(assigned_agent_name)) not in (
--       select lower(btrim(full_name)) from public.profiles where active is not false and full_name is not null )
--   group by assigned_agent_name order by 2 desc;

-- STEP 2 — THE FIX (keeps a copy of the old name in original_agent for history, then blanks it):
do $$
begin
  -- preserve the old typed name in original_agent (history) where that column is empty
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='leads' and column_name='original_agent') then
    update public.leads l
       set original_agent = coalesce(l.original_agent, l.assigned_agent_name)
     where l.deleted is not true
       and l.assigned_agent is null
       and l.assigned_agent_name is not null
       and btrim(l.assigned_agent_name) <> ''
       and lower(btrim(l.assigned_agent_name)) not in (
         select lower(btrim(p.full_name)) from public.profiles p where p.active is not false and p.full_name is not null );
  end if;

  update public.leads l
     set assigned_agent_name = null
   where l.deleted is not true
     and l.assigned_agent is null
     and l.assigned_agent_name is not null
     and btrim(l.assigned_agent_name) <> ''
     and lower(btrim(l.assigned_agent_name)) not in (
       select lower(btrim(p.full_name)) from public.profiles p where p.active is not false and p.full_name is not null );
end $$;

-- Verify (should now be 0):
-- select count(*) from public.leads
-- where deleted is not true and assigned_agent is null and assigned_agent_name is not null
--   and lower(btrim(assigned_agent_name)) not in (
--     select lower(btrim(full_name)) from public.profiles where active is not false and full_name is not null );
