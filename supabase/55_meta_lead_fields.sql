-- Migration 55: link a CRM lead to its Meta (Facebook/Instagram) Lead Ad + webhook idempotency.
--
-- ADDITIVE & SAFE: nullable columns only, plus one unique index so the webhook can never insert
-- the same Meta lead twice. Existing rows keep meta_lead_id = NULL (Postgres treats NULLs as
-- distinct, so the unique index allows unlimited NULLs). No RLS, policy, or data changes.
-- The api/meta-leads.js webhook works with or without this migration; applying it just turns on
-- duplicate-protection and lets you trace a CRM lead back to its Meta lead/form.

alter table public.leads add column if not exists meta_lead_id     text;
alter table public.leads add column if not exists meta_form_id     text;
alter table public.leads add column if not exists meta_created_time timestamptz;

create unique index if not exists uq_leads_meta_lead_id
  on public.leads (meta_lead_id);
