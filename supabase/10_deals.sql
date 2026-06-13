-- =====================================================================
-- Amber Lead Desk — Migration 10: Close Deal / Deal Submission / Approval
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- =====================================================================

-- 1) Agent commission settings on the profile (Master Admin sets these).
alter table public.profiles add column if not exists sales_commission_pct  numeric;
alter table public.profiles add column if not exists rental_commission_pct numeric;
alter table public.profiles add column if not exists company_split_pct     numeric;
alter table public.profiles add column if not exists commission_notes      text;
alter table public.profiles add column if not exists commission_active     boolean default true;

-- 2) Deals
create sequence if not exists public.deals_no_seq;
create table if not exists public.deals (
  id                  uuid primary key default gen_random_uuid(),
  deal_no             bigint not null default nextval('public.deals_no_seq'),
  lead_id             uuid references public.leads(id) on delete set null,
  agent_id            uuid references public.profiles(id),   -- closing agent / submitter
  client_name         text,
  lead_source         text,
  deal_type           text,            -- Sales | Rental
  transaction_side    text,            -- Buyer | Seller | Landlord | Tenant | Direct | Co-broker
  area                text,
  project             text,
  developer           text,
  property_type       text,
  unit_no             text,
  bedrooms            text,
  property_value      numeric,
  ready_offplan       text,
  commission_pct      numeric,
  gross_commission    numeric,
  vat_amount          numeric,
  net_commission      numeric,
  agent_commission_pct numeric,
  agent_commission    numeric,
  company_share       numeric,
  external_split      numeric,
  referral_fee        numeric,
  other_deductions    numeric,
  final_net           numeric,
  sole_agent          boolean default true,
  participants        jsonb default '[]'::jsonb,
  status              text not null default 'draft',  -- draft|submitted|pending_review|approved|rejected|needs_correction|cancelled
  admin_notes         text,
  correction_note     text,
  reviewer_id         uuid references public.profiles(id),
  submitted_at        timestamptz,
  decided_at          timestamptz,
  accounts_status     text,            -- null until approved, then 'Pending Accounts'
  created_by          uuid references public.profiles(id),
  deleted             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists deals_agent_idx on public.deals(agent_id, status);
create index if not exists deals_status_idx on public.deals(status, created_at);

create table if not exists public.deal_documents (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references public.deals(id) on delete cascade,
  doc_type     text not null,        -- kyc|passport|emirates_id|booking_form|spa_contract|tenancy_contract|payment_proof|buyer_form|seller_form|landlord_form|tenant_form|commission_agreement|agency_agreement|other
  file_name    text not null,
  storage_path text,                  -- path inside private 'deal-docs' bucket
  url          text,                  -- optional external link fallback
  uploaded_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);
create index if not exists deal_documents_deal_idx on public.deal_documents(deal_id);

create table if not exists public.deal_activity (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid references public.deals(id) on delete cascade,
  actor_id    uuid references public.profiles(id),
  action      text not null,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists deal_activity_deal_idx on public.deal_activity(deal_id, created_at);

alter table public.deals          enable row level security;
alter table public.deal_documents enable row level security;
alter table public.deal_activity  enable row level security;

-- Deals: admins see all; agent sees own (closing or creator). Agent edits only draft/needs_correction
-- and can never set an approval status (WITH CHECK restricts the statuses an agent may write).
drop policy if exists deals_select on public.deals;
create policy deals_select on public.deals for select using (
  public.is_admin() or agent_id = auth.uid() or created_by = auth.uid()
);
drop policy if exists deals_insert on public.deals;
create policy deals_insert on public.deals for insert with check (
  public.is_admin() or ((agent_id = auth.uid() or created_by = auth.uid()) and status in ('draft','submitted'))
);
drop policy if exists deals_update on public.deals;
create policy deals_update on public.deals for update using (
  public.is_admin() or ((agent_id = auth.uid() or created_by = auth.uid()) and status in ('draft','needs_correction'))
) with check (
  public.is_admin() or ((agent_id = auth.uid() or created_by = auth.uid()) and status in ('draft','submitted','needs_correction','cancelled'))
);
drop policy if exists deals_delete on public.deals;
create policy deals_delete on public.deals for delete using ( public.is_admin() );

-- Deal documents: admins all; agent only docs of their own deals.
drop policy if exists deal_docs_select on public.deal_documents;
create policy deal_docs_select on public.deal_documents for select using (
  public.is_admin() or exists (select 1 from public.deals d where d.id = deal_id and (d.agent_id = auth.uid() or d.created_by = auth.uid()))
);
drop policy if exists deal_docs_insert on public.deal_documents;
create policy deal_docs_insert on public.deal_documents for insert with check (
  public.is_admin() or exists (select 1 from public.deals d where d.id = deal_id and (d.agent_id = auth.uid() or d.created_by = auth.uid()))
);
drop policy if exists deal_docs_delete on public.deal_documents;
create policy deal_docs_delete on public.deal_documents for delete using (
  public.is_admin() or uploaded_by = auth.uid()
);

-- Deal activity: admins all; agent reads own deals' activity; any authenticated user inserts their own action.
drop policy if exists deal_activity_select on public.deal_activity;
create policy deal_activity_select on public.deal_activity for select using (
  public.is_admin() or exists (select 1 from public.deals d where d.id = deal_id and (d.agent_id = auth.uid() or d.created_by = auth.uid()))
);
drop policy if exists deal_activity_insert on public.deal_activity;
create policy deal_activity_insert on public.deal_activity for insert with check ( actor_id = auth.uid() );

-- PRIVATE storage bucket for sensitive deal documents (KYC, passport, etc).
-- Downloads use signed URLs; only the uploader (owner) or an admin can read. Best-effort; if it
-- errors, create a PRIVATE bucket named 'deal-docs' in Supabase → Storage.
do $$
begin
  insert into storage.buckets (id, name, public) values ('deal-docs', 'deal-docs', false)
  on conflict (id) do nothing;
exception when others then null;
end $$;
do $$
begin
  drop policy if exists deal_docs_read on storage.objects;
  create policy deal_docs_read on storage.objects for select using ( bucket_id = 'deal-docs' and (public.is_admin() or owner = auth.uid()) );
  drop policy if exists deal_docs_upload on storage.objects;
  create policy deal_docs_upload on storage.objects for insert with check ( bucket_id = 'deal-docs' and auth.role() = 'authenticated' );
  drop policy if exists deal_docs_remove on storage.objects;
  create policy deal_docs_remove on storage.objects for delete using ( bucket_id = 'deal-docs' and (public.is_admin() or owner = auth.uid()) );
exception when others then null;
end $$;
-- =====================================================================
-- DONE.
-- =====================================================================
