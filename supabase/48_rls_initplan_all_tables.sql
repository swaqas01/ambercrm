-- 48_rls_initplan_all_tables.sql
-- Amber Homes — performance: per-query (not per-row) evaluation of auth/role checks in RLS,
-- across every remaining table (Performance Advisor: auth_rls_initplan). leads was already done
-- in migration 45. The access logic of each policy is IDENTICAL — only auth.uid()/auth.role()/
-- is_admin()/is_master()/is_ops_admin() are wrapped in (select ...) so they run once per query.
-- Wrapped in a transaction: it all applies or nothing does.
--
-- ROLLBACK: the original (unwrapped) policy bodies live in the numbered migrations in this repo.

begin;

-- ── admin_audit ──
alter policy admin_audit_insert on public.admin_audit with check (((select auth.role()) = 'authenticated'::text));
alter policy admin_audit_select on public.admin_audit using ((select is_master()));
-- ── agent_profiles ──
alter policy agent_profiles_delete on public.agent_profiles using ((select is_master()));
alter policy agent_profiles_insert on public.agent_profiles with check (((user_id = (select auth.uid())) OR (select is_admin())));
alter policy agent_profiles_select on public.agent_profiles using (((user_id = (select auth.uid())) OR (select is_admin())));
alter policy agent_profiles_update on public.agent_profiles using (((user_id = (select auth.uid())) OR (select is_admin()))) with check (((user_id = (select auth.uid())) OR (select is_admin())));
-- ── agent_targets ──
alter policy agent_targets_read on public.agent_targets using (((agent_id = (select auth.uid())) OR (select is_admin())));
alter policy agent_targets_write on public.agent_targets using ((select is_master())) with check ((select is_master()));
-- ── ai_feedback ──
alter policy ai_feedback_insert on public.ai_feedback with check ((user_id = (select auth.uid())));
alter policy ai_feedback_select on public.ai_feedback using (((user_id = (select auth.uid())) OR (select is_master())));
-- ── ai_knowledge ──
alter policy ai_knowledge_insert on public.ai_knowledge with check ((select is_admin()));
alter policy ai_knowledge_select on public.ai_knowledge using (((select is_admin()) OR ((status = 'active'::text) AND (deleted = false) AND (visibility <> 'admin_only'::text))));
alter policy ai_knowledge_update on public.ai_knowledge using ((select is_admin())) with check ((select is_admin()));
-- ── ai_logs ──
alter policy ai_logs_insert on public.ai_logs with check ((user_id = (select auth.uid())));
alter policy ai_logs_select on public.ai_logs using (((user_id = (select auth.uid())) OR (select is_master())));
-- ── ai_sources ──
alter policy ai_sources_read on public.ai_sources using ((active OR (select is_master())));
alter policy ai_sources_write on public.ai_sources using ((select is_master())) with check ((select is_master()));
-- ── ai_web_log ──
alter policy ai_web_log_insert on public.ai_web_log with check ((user_id = (select auth.uid())));
alter policy ai_web_log_read on public.ai_web_log using ((select is_master()));
-- ── app_settings ──
alter policy app_settings_write on public.app_settings using ((select is_master())) with check ((select is_master()));
-- ── auth_logs ──
alter policy auth_logs_select on public.auth_logs using ((select is_admin()));
-- ── deal_activity ──
alter policy deal_activity_insert on public.deal_activity with check ((actor_id = (select auth.uid())));
alter policy deal_activity_select on public.deal_activity using (((select is_admin()) OR (EXISTS ( SELECT 1 FROM deals d WHERE ((d.id = deal_activity.deal_id) AND ((d.agent_id = (select auth.uid())) OR (d.created_by = (select auth.uid()))))))));
-- ── deal_documents ──
alter policy deal_docs_delete on public.deal_documents using (((select is_admin()) OR (uploaded_by = (select auth.uid()))));
alter policy deal_docs_insert on public.deal_documents with check (((select is_admin()) OR (EXISTS ( SELECT 1 FROM deals d WHERE ((d.id = deal_documents.deal_id) AND ((d.agent_id = (select auth.uid())) OR (d.created_by = (select auth.uid()))))))));
alter policy deal_docs_select on public.deal_documents using (((select is_admin()) OR (EXISTS ( SELECT 1 FROM deals d WHERE ((d.id = deal_documents.deal_id) AND ((d.agent_id = (select auth.uid())) OR (d.created_by = (select auth.uid()))))))));
-- ── deals ──
alter policy deals_delete on public.deals using ((select is_admin()));
alter policy deals_insert on public.deals with check (((select is_admin()) OR (((agent_id = (select auth.uid())) OR (created_by = (select auth.uid()))) AND (status = ANY (ARRAY['draft'::text, 'submitted'::text])))));
alter policy deals_select on public.deals using (((select is_admin()) OR (agent_id = (select auth.uid())) OR (created_by = (select auth.uid()))));
alter policy deals_update on public.deals using (((select is_admin()) OR (((agent_id = (select auth.uid())) OR (created_by = (select auth.uid()))) AND (status = ANY (ARRAY['draft'::text, 'needs_correction'::text]))))) with check (((select is_admin()) OR (((agent_id = (select auth.uid())) OR (created_by = (select auth.uid()))) AND (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'needs_correction'::text, 'cancelled'::text])))));
-- ── default_agent_targets ──
alter policy default_targets_write on public.default_agent_targets using ((select is_master())) with check ((select is_master()));
-- ── file_downloads ──
alter policy file_downloads_insert on public.file_downloads with check (((select auth.role()) = 'authenticated'::text));
alter policy file_downloads_select on public.file_downloads using (((select is_admin()) OR (user_id = (select auth.uid()))));
-- ── follow_ups ──
alter policy follow_ups_insert on public.follow_ups with check (((select is_admin()) OR ((created_by = (select auth.uid())) AND (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = follow_ups.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid())) OR (l.is_open = true))))))));
alter policy follow_ups_select on public.follow_ups using (((select is_admin()) OR (created_by = (select auth.uid())) OR (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = follow_ups.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid())) OR (l.is_open = true)))))));
alter policy follow_ups_update on public.follow_ups using (((select is_admin()) OR (created_by = (select auth.uid())) OR (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = follow_ups.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid())))))))) with check (((select is_admin()) OR (created_by = (select auth.uid())) OR (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = follow_ups.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid()))))))));
-- ── hot_resale_deals ──
alter policy hot_deals_insert on public.hot_resale_deals with check (((select is_admin()) OR (agent_id = (select auth.uid()))));
alter policy hot_deals_select on public.hot_resale_deals using (((select is_admin()) OR (status = 'Approved'::text) OR (agent_id = (select auth.uid()))));
alter policy hot_deals_update on public.hot_resale_deals using (((select is_admin()) OR (agent_id = (select auth.uid())))) with check (((select is_admin()) OR (agent_id = (select auth.uid()))));
-- ── lead_activity ──
alter policy activity_insert on public.lead_activity with check ((actor_id = (select auth.uid())));
alter policy activity_select on public.lead_activity using (((select is_admin()) OR (actor_id = (select auth.uid())) OR (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = lead_activity.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid())) OR (l.is_open = true)))))));
-- ── lead_comments ──
alter policy lead_comments_insert on public.lead_comments with check (((author_id = (select auth.uid())) AND ((select is_admin()) OR (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = lead_comments.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid())) OR (l.is_open = true))))))));
alter policy lead_comments_select on public.lead_comments using (((select is_admin()) OR (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = lead_comments.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid())) OR (l.is_open = true)))))));
alter policy lead_comments_update on public.lead_comments using (((author_id = (select auth.uid())) OR (select is_admin()))) with check (((author_id = (select auth.uid())) OR (select is_admin())));
-- ── lead_ownership_history ──
alter policy ownership_insert on public.lead_ownership_history with check (((select auth.role()) = 'authenticated'::text));
alter policy ownership_select on public.lead_ownership_history using (((select is_admin()) OR (EXISTS ( SELECT 1 FROM leads l WHERE ((l.id = lead_ownership_history.lead_id) AND ((l.assigned_agent = (select auth.uid())) OR (l.current_owner = (select auth.uid())) OR (l.created_by = (select auth.uid()))))))));
-- ── lead_reveals ──
alter policy lr_insert_own on public.lead_reveals with check ((agent_id = (select auth.uid())));
alter policy lr_select_own on public.lead_reveals using (((agent_id = (select auth.uid())) OR (select is_admin())));
-- ── notifications ──
alter policy notif_insert on public.notifications with check (((select auth.role()) = 'authenticated'::text));
alter policy notif_select on public.notifications using (((user_id = (select auth.uid())) OR ((user_id IS NULL) AND (select is_admin()))));
alter policy notif_update on public.notifications using (((user_id = (select auth.uid())) OR ((user_id IS NULL) AND (select is_admin())))) with check (((user_id = (select auth.uid())) OR ((user_id IS NULL) AND (select is_admin()))));
-- ── open_leads_settings ──
alter policy ols_select on public.open_leads_settings using ((select is_admin()));
alter policy ols_write on public.open_leads_settings using ((select is_admin())) with check ((select is_admin()));
-- ── profiles ──
alter policy profiles_admin_write on public.profiles using ((select is_master())) with check ((select is_master()));
alter policy profiles_read_self on public.profiles using (((id = (select auth.uid())) OR (select is_admin())));
-- ── project_files ──
alter policy project_files_delete on public.project_files using ((select is_admin()));
alter policy project_files_insert on public.project_files with check ((select is_admin()));
alter policy project_files_select on public.project_files using (((select is_admin()) OR ((internal_only = false) AND (EXISTS ( SELECT 1 FROM projects p WHERE ((p.id = project_files.project_id) AND (p.deleted = false) AND (p.agent_visible = true) AND (p.status <> 'inactive'::text)))))));
alter policy project_files_update on public.project_files using ((select is_admin())) with check ((select is_admin()));
-- ── projects ──
alter policy projects_insert on public.projects with check ((select is_admin()));
alter policy projects_select on public.projects using (((select is_admin()) OR ((deleted = false) AND (agent_visible = true) AND (status <> 'inactive'::text))));
alter policy projects_update on public.projects using ((select is_admin())) with check ((select is_admin()));
-- ── push_subscriptions ──
alter policy push_sub_delete on public.push_subscriptions using ((user_id = (select auth.uid())));
alter policy push_sub_insert on public.push_subscriptions with check ((user_id = (select auth.uid())));
alter policy push_sub_select on public.push_subscriptions using (((user_id = (select auth.uid())) OR (select is_master())));
alter policy push_sub_update on public.push_subscriptions using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
-- ── security_alerts ──
alter policy sa_admin_select on public.security_alerts using ((select is_master()));
alter policy sa_admin_update on public.security_alerts using ((select is_master())) with check ((select is_master()));
-- ── target_history ──
alter policy target_history_read on public.target_history using ((select is_admin()));
alter policy target_history_write on public.target_history with check ((select is_master()));
-- ── user_device_sessions ──
alter policy uds_select on public.user_device_sessions using (((user_id = (select auth.uid())) OR (select is_admin())));
-- ── user_devices ──
alter policy user_devices_insert on public.user_devices with check ((user_id = (select auth.uid())));
alter policy user_devices_select on public.user_devices using (((user_id = (select auth.uid())) OR (select is_admin())));
alter policy user_devices_update on public.user_devices using (((user_id = (select auth.uid())) OR (select is_admin()))) with check (((user_id = (select auth.uid())) OR (select is_admin())));

commit;
