-- =====================================================================
-- Amber Lead Desk — Migration 07: AI Knowledge Base for Ask Amber
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- =====================================================================
create table if not exists public.ai_knowledge (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null default 'Company Overview',
  content     text not null,
  status      text not null default 'active',     -- active | inactive
  priority    int  not null default 2,            -- 1 high, 2 normal, 3 low
  visibility  text not null default 'all',         -- all | ambreen_ai | saad_ai | ibrahim_ai | admin_only | agent_ok
  source      text,
  tags        text,
  review_date date,
  added_by    uuid references public.profiles(id),
  updated_by  uuid references public.profiles(id),
  deleted     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ai_knowledge_active_idx on public.ai_knowledge(status, deleted);

alter table public.ai_knowledge enable row level security;

-- Admins manage everything; agents may READ active, non-admin-only items (so Ask Amber can use them).
drop policy if exists ai_knowledge_select on public.ai_knowledge;
create policy ai_knowledge_select on public.ai_knowledge for select using (
  public.is_admin() or (status = 'active' and deleted = false and visibility <> 'admin_only')
);
drop policy if exists ai_knowledge_insert on public.ai_knowledge;
create policy ai_knowledge_insert on public.ai_knowledge for insert with check ( public.is_admin() );
drop policy if exists ai_knowledge_update on public.ai_knowledge;
create policy ai_knowledge_update on public.ai_knowledge for update using ( public.is_admin() ) with check ( public.is_admin() );

-- Seed starter items (only if the table is empty)
insert into public.ai_knowledge (title, category, content, visibility, priority, source)
select * from (values
 ('Amber Homes Company Overview','Company Overview','Amber Homes Real Estate is a Dubai-based real estate brokerage and investment advisory company. We help investors, families, high-net-worth buyers and property clients make smarter decisions in Dubai real estate — leading with advice and data rather than listings and hype.','all',1,'Seed'),
 ('Amber Homes Brand Positioning','Company Overview','Positioning: investment-focused, senior-led, trusted, premium, practical, data-aware and client-first, focused on the Dubai market. Brand line: "Advice before listings. Data before hype. Dubai property investment with senior guidance." We are known for honest advisory, not pushing every launch.','all',1,'Seed'),
 ('Amber Homes Awards and Recognition','Awards and Recognition','Amber Homes is a multi-award-winning Dubai real estate company, recognised by leading developers for strong sales performance. Use careful wording: "recognised by" or "award-winning with". Do NOT state "No. 1", exact award titles, years, or rankings unless they are written explicitly in an active knowledge item with verified proof.','all',1,'Seed'),
 ('Developer Recognition: Meraas','Developer Relationships','Amber Homes has been recognised among leading agencies for Meraas projects. When speaking to clients, you may say Amber Homes is recognised by Meraas for sales performance. Do not invent exact award names, tiers or years unless verified here.','all',2,'Seed'),
 ('Developer Recognition: Nakheel','Developer Relationships','Amber Homes has been recognised among leading agencies for Nakheel projects (e.g. Palm Jebel Ali, Dubai Islands). You may say Amber Homes is recognised by Nakheel for sales performance. Do not invent exact award names, tiers or years unless verified here.','all',2,'Seed'),
 ('Developer Recognition: Dubai Holding','Developer Relationships','Amber Homes has been recognised among leading agencies for Dubai Holding projects. You may say Amber Homes is recognised by Dubai Holding for sales performance. Do not invent exact award names, tiers or years unless verified here.','all',2,'Seed'),
 ('Amber Homes Sales Philosophy','Sales Scripts','Qualify the client properly: understand budget, purpose (investment vs personal use), timeline and finance (cash vs mortgage). Understand area and project preference. Guide based on investment logic, compare options clearly, explain risks, and protect the client from bad decisions. Close with trust, not pressure.','all',1,'Seed'),
 ('Amber Homes Lead Follow-Up Rules','Internal Policies','Call quickly. WhatsApp professionally. Update the CRM after every contact and set the next follow-up. Do not let hot leads go cold. Document client preferences. Never hide lead activity — the CRM is the source of truth.','all',1,'Seed'),
 ('Amber Homes Client-Facing Introduction','Sales Scripts','Suggested intro: "Amber Homes Real Estate is a Dubai-based, multi-award-winning real estate advisory and brokerage recognised by leading developers including Meraas, Nakheel and Dubai Holding. We help clients choose property based on budget, purpose, area, developer strength and long-term investment logic."','all',1,'Seed'),
 ('Do Not Say / Compliance Rules','Compliance / Do Not Say','Do NOT: guarantee ROI or capital appreciation; promise a client will definitely get a Golden Visa; say every project is good; create fake urgency; insult competitors; reveal internal commission details to clients; reveal other agents'' data; give legal or tax advice beyond the general real estate process; or claim "No. 1"/"best in UAE" without verified proof. Always use careful, honest wording.','all',1,'Seed'),
 ('Dubai Property Investment Advisory','Investment Guidance','Frame investment around the client''s goal: rental yield vs capital growth vs personal use. Discuss area maturity, developer track record, payment plan, service charges and handover timeline. Explain risks honestly. Never promise fixed returns; speak in ranges and general market terms only.','all',2,'Seed'),
 ('Golden Visa Property Guidance','Golden Visa Guidance','The UAE offers long-term residency linked to qualifying property investment. Explain the concept generally and that eligibility depends on current rules and verified thresholds. Do not promise a client will definitely qualify — direct specifics to verified, up-to-date sources.','all',2,'Seed'),
 ('Off-Plan Client Explanation','Sales Scripts','Off-plan means buying before/during construction, usually with a staged payment plan and a future handover. Benefits: lower entry, payment plans, potential appreciation during construction. Risks: handover timing and market movement. Always present both sides honestly.','all',2,'Seed'),
 ('Palm Jebel Ali Basic Talking Points','Project Knowledge','Palm Jebel Ali is a large Nakheel master development — a long-term, premium waterfront destination. Talking points: master-developer strength (Nakheel), waterfront positioning, long-term horizon. Keep claims general; do not quote prices or returns unless verified in a current note.','all',2,'Seed'),
 ('Meraas Client Talking Points','Developer Knowledge','Meraas is known for lifestyle-led, design-forward Dubai communities (e.g. City Walk, Bluewaters, Madinat Jumeirah Living). Position on design quality and location. Keep specifics general unless verified.','all',2,'Seed'),
 ('Nakheel Client Talking Points','Developer Knowledge','Nakheel is a major Dubai master developer behind landmark waterfront communities (Palm Jumeirah, Palm Jebel Ali, Dubai Islands). Position on master-developer scale and waterfront landmarks. Keep specifics general unless verified.','all',2,'Seed'),
 ('Dubai Holding Client Talking Points','Developer Knowledge','Dubai Holding is a large diversified Dubai developer/owner behind major communities and destinations. Position on institutional scale and long-term community development. Keep specifics general unless verified.','all',2,'Seed')
) as v(title, category, content, visibility, priority, source)
where not exists (select 1 from public.ai_knowledge);

-- =====================================================================
-- DONE.
-- =====================================================================
