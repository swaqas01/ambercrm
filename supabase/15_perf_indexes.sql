-- ============================================================================
-- 15_perf_indexes.sql
-- Indexes for the columns the CRM filters/sorts on most. All IF NOT EXISTS, so
-- this is safe to run repeatedly and safe on a populated database.
-- ============================================================================

-- Leads: list sorting + every dashboard/pipeline/assignment filter.
create index if not exists idx_leads_created_at      on public.leads (created_at desc);
create index if not exists idx_leads_assigned_agent  on public.leads (assigned_agent);
create index if not exists idx_leads_current_owner   on public.leads (current_owner);
create index if not exists idx_leads_status          on public.leads (status);
create index if not exists idx_leads_temperature     on public.leads (temperature);
create index if not exists idx_leads_source          on public.leads (source);
create index if not exists idx_leads_project         on public.leads (project);
create index if not exists idx_leads_area            on public.leads (area);
create index if not exists idx_leads_is_open         on public.leads (is_open) where is_open = true;
create index if not exists idx_leads_next_followup   on public.leads (next_followup);
create index if not exists idx_leads_deleted         on public.leads (deleted);

-- Follow-ups: dashboard "due / overdue".
create index if not exists idx_followups_due_at      on public.follow_ups (due_at);
create index if not exists idx_followups_agent_id    on public.follow_ups (agent_id);
create index if not exists idx_followups_lead_id     on public.follow_ups (lead_id);

-- Activity log: per-agent + per-lead lookups (performance + timeline).
create index if not exists idx_activity_actor        on public.lead_activity (actor_id);
create index if not exists idx_activity_lead         on public.lead_activity (lead_id);
create index if not exists idx_activity_created      on public.lead_activity (created_at desc);

-- Comments: per-lead.
create index if not exists idx_comments_lead         on public.lead_comments (lead_id);

-- Deals: dashboard + performance.
create index if not exists idx_deals_status          on public.deals (status);
create index if not exists idx_deals_agent           on public.deals (agent_id);

-- AI + security logs.
create index if not exists idx_ai_logs_user          on public.ai_logs (user_id);
create index if not exists idx_ai_logs_created       on public.ai_logs (created_at desc);

-- Hot resale deals + projects (dashboard + matching).
create index if not exists idx_hotdeals_status       on public.hot_resale_deals (status);
create index if not exists idx_projects_status       on public.projects (status);
create index if not exists idx_projects_featured     on public.projects (featured_on_dashboard) where featured_on_dashboard = true;

-- Ownership history + notifications.
create index if not exists idx_ownership_lead        on public.lead_ownership_history (lead_id);
create index if not exists idx_notifications_user    on public.notifications (user_id);
