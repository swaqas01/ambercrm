-- 65_marketing_drilldown_fix.sql
-- Amber Homes — fix: Marketing drill-down drawer shows "No leads" even when the row counts leads.
--
-- Root cause: public.marketing_leads() is plpgsql RETURNS TABLE(id uuid, ...). Inside it, the agent-name
-- lookup was `select full_name from public.profiles where id = b.orig_agent` — `id` is BOTH a profiles
-- column and the function's own OUT variable, so plpgsql raises "column reference \"id\" is ambiguous"
-- at runtime. The frontend catches the error and renders an empty list. marketing_report() is unaffected
-- (no OUT variable named id), which is why the counts were correct while the drawer was empty.
--
-- Fix: alias the profiles table and fully qualify (p.id / p.full_name). Function body otherwise identical.
-- SAFE / IDEMPOTENT. ROLLBACK: none needed (previous version was broken).

begin;

create or replace function public.marketing_leads(
  p_from        timestamptz default null,
  p_to          timestamptz default null,
  p_source      text        default null,
  p_campaign    text        default null,
  p_agent       uuid        default null,
  p_assigned_by uuid        default null,
  p_project     text        default null
) returns table (
  id uuid, lead_code text, client_name text, source text, source_bucket text,
  project text, campaign text, status text, temperature text, is_open boolean,
  orig_agent uuid, orig_agent_name text, last_contacted date, created_at timestamptz, deal_value numeric
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_view_marketing() then return; end if;
  return query
    select b.id, b.lead_code, b.client_name, b.source, b.source_bucket, b.project, b.campaign,
           b.status, b.temperature, b.is_open, b.orig_agent,
           coalesce((select p.full_name from public.profiles p where p.id = b.orig_agent), 'Unassigned'),
           b.last_contacted, b.created_at, b.deal_value
    from public.marketing_base_rows() b
    where (p_from        is null or b.created_at >= p_from)
      and (p_to          is null or b.created_at <  p_to)
      and (p_source      is null or b.source_bucket = p_source)
      and (p_campaign    is null or b.project = p_campaign or b.campaign = p_campaign)
      and (p_agent       is null or b.orig_agent = p_agent)
      and (p_assigned_by is null or b.assigned_by_id = p_assigned_by)
      and (p_project     is null or coalesce(nullif(b.project, ''), '(No project)') = p_project)
    order by b.created_at desc
    limit 2000;
end $$;

revoke all on function public.marketing_leads(timestamptz, timestamptz, text, text, uuid, uuid, text) from public, anon;
grant  execute on function public.marketing_leads(timestamptz, timestamptz, text, text, uuid, uuid, text) to authenticated;

commit;
