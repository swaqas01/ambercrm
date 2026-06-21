-- ============================================================================
-- AMBER CRM — FULL SCHEMA VERIFICATION  (READ-ONLY — safe to run on production)
-- Run in Supabase → SQL Editor. It reads catalog metadata only; it does NOT read,
-- change, or delete any data, and touches no RLS/policies. Returns ONE result grid:
-- every expected object marked PRESENT or *** MISSING *** (missing sorted to the top).
-- ============================================================================

with
expected_tables(name) as (values
  ('profiles'),('leads'),('lead_activity'),('lead_comments'),('lead_reveals'),
  ('lead_ownership_history'),('follow_ups'),('deals'),('deal_activity'),('deal_documents'),
  ('projects'),('project_files'),('hot_resale_deals'),('notifications'),('admin_audit'),
  ('ai_knowledge'),('ai_logs'),('ai_sources'),('ai_feedback'),('ai_web_log'),
  ('app_settings'),('auth_otp'),('auth_logs'),('security_alerts'),('open_leads_settings'),
  ('push_subscriptions'),('user_devices'),('agent_profiles'),('agent_targets'),
  ('default_agent_targets'),('target_history')
),
expected_functions(name) as (values
  ('is_admin'),('is_master'),('is_ops_admin'),('my_role'),('handle_new_user'),
  ('reveal_contact'),('check_duplicate_phone'),('readd_lead'),('mark_lead_open'),
  ('assign_open_lead'),('auto_open_stale_leads'),('set_my_avatar'),('normalize_phone'),
  ('set_normalized_phone'),('set_lead_no'),('enforce_master_admin'),('guard_protected_columns'),
  ('guard_hot_deal'),('notify_hot_deal'),('security_overview'),('touch_updated_at'),
  ('agent_profiles_touch'),('targets_touch')
),
expected_indexes(name) as (values
  -- base lead indexes (migrations 15 + 27)
  ('idx_leads_created_at'),('idx_leads_assigned_agent'),('idx_leads_current_owner'),
  ('idx_leads_created_by'),('idx_leads_status'),('idx_leads_temperature'),('idx_leads_project'),
  ('idx_leads_area'),('idx_leads_source'),('idx_leads_next_followup'),('idx_leads_is_open'),
  ('idx_leads_assigned_name'),('idx_leads_deleted'),('idx_leads_normalized_phone'),
  ('idx_leads_agent_created'),('idx_leads_agent_temp_created'),('idx_leads_agent_status_created'),
  ('idx_leads_followup_agent'),('idx_leads_project_created'),('idx_leads_area_created'),
  ('idx_leads_unassigned'),('idx_leads_open_pool'),
  -- activity / deals / follow-ups / comments / ai (migrations 10 + 15)
  ('idx_activity_actor'),('idx_activity_lead'),('idx_activity_created'),
  ('idx_deals_status'),('idx_deals_agent'),
  ('idx_followups_due_at'),('idx_followups_agent_id'),('idx_followups_lead_id'),
  ('idx_comments_lead'),('idx_ai_logs_user'),('idx_ai_logs_created'),
  -- supplemental composites (migration 35 — the one you just ran)
  ('idx_leads_status_created'),('idx_leads_temp_created'),('idx_leads_source_created'),
  ('idx_leads_createdby_created'),('idx_leads_assignedname_created'),
  ('idx_activity_actor_created'),('idx_activity_actor_action_created'),('idx_deals_status_decided')
),
expected_columns(tbl, col) as (values
  ('profiles','phone'),('profiles','whatsapp'),('profiles','last_login'),
  ('profiles','force_password_change'),('profiles','avatar_url'),
  ('leads','lead_type'),('leads','is_open'),('leads','assigned_agent'),
  ('leads','assigned_agent_name'),('leads','normalized_phone'),('leads','next_followup'),
  ('agent_profiles','signature_photo_url'),('agent_profiles','whatsapp'),
  ('agent_targets','is_active'),('app_settings','key')
),
rls_tables(name) as (values
  ('leads'),('profiles'),('deals'),('lead_activity'),('lead_comments'),('lead_reveals'),
  ('agent_profiles'),('agent_targets'),('user_devices'),('push_subscriptions'),
  ('ai_sources'),('app_settings'),('follow_ups'),('notifications')
),
report as (
  select 'TABLE' as kind, t.name as object,
         case when to_regclass('public.'||t.name) is not null
              then 'PRESENT' else '*** MISSING ***' end as status
  from expected_tables t
  union all
  select 'FUNCTION', f.name,
         case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'public' and p.proname = f.name)
              then 'PRESENT' else '*** MISSING ***' end
  from expected_functions f
  union all
  select 'INDEX', i.name,
         case when exists (select 1 from pg_indexes x
                           where x.schemaname = 'public' and x.indexname = i.name)
              then 'PRESENT' else '*** MISSING ***' end
  from expected_indexes i
  union all
  select 'COLUMN', c.tbl || '.' || c.col,
         case when exists (select 1 from information_schema.columns ic
                           where ic.table_schema = 'public' and ic.table_name = c.tbl
                             and ic.column_name = c.col)
              then 'PRESENT' else '*** MISSING ***' end
  from expected_columns c
  union all
  select 'RLS', r.name,
         case when exists (select 1 from pg_class cl join pg_namespace n on n.oid = cl.relnamespace
                           where n.nspname = 'public' and cl.relname = r.name
                             and cl.relkind = 'r' and cl.relrowsecurity)
              then 'PRESENT (RLS ON)'
              when to_regclass('public.'||r.name) is null then '*** TABLE MISSING ***'
              else '*** MISSING (RLS OFF) ***' end
  from rls_tables r
)
select kind, object, status
from report
order by case when status like '%MISSING%' then 0 else 1 end,  -- missing first
         kind, object;
