-- ============================================================================
-- 14_ai_sources.sql
-- Ask Amber: Master-Admin-managed approved web-source whitelist, a global
-- web-research toggle, a web-research query log, and a seeded Golden Visa
-- knowledge category. Safe to run multiple times.
-- ============================================================================

-- ---------- 1) app_settings: small key/value store for global toggles ----------
create table if not exists public.app_settings (
  key         text primary key,
  value       text,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);
alter table public.app_settings enable row level security;
-- Non-sensitive flags; readable by the app + the AI proxy (anon), writable by Master Admin only.
drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings for select to anon, authenticated using ( true );
drop policy if exists app_settings_write on public.app_settings;
create policy app_settings_write on public.app_settings for all to authenticated using ( public.is_master() ) with check ( public.is_master() );
-- Web research is OFF by default — Master Admin opts in once the Anthropic plan/web-search is confirmed.
insert into public.app_settings (key, value) values ('web_research_enabled', 'false')
  on conflict (key) do nothing;

-- ---------- 2) ai_sources: the approved web-source whitelist ----------
create table if not exists public.ai_sources (
  id           uuid primary key default gen_random_uuid(),
  domain       text not null unique,                 -- hostname only, e.g. emaar.com
  name         text not null,
  trust_level  int  not null default 3,              -- 1 govt/verification … 5 training/regulation
  category     text not null default 'developer',    -- government | developer | portal | news | regulation
  active       boolean not null default true,
  notes        text,
  last_used_at timestamptz,
  added_by     uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.ai_sources enable row level security;
-- Active sources are readable by the app and the AI proxy (anon); Master Admin sees all + manages.
drop policy if exists ai_sources_read on public.ai_sources;
create policy ai_sources_read on public.ai_sources for select to anon, authenticated using ( active or public.is_master() );
drop policy if exists ai_sources_write on public.ai_sources;
create policy ai_sources_write on public.ai_sources for all to authenticated using ( public.is_master() ) with check ( public.is_master() );
create index if not exists idx_ai_sources_active on public.ai_sources (active);
create index if not exists idx_ai_sources_trust  on public.ai_sources (trust_level);

-- Seed the Amber Homes AI Agent Crawl Whitelist (idempotent).
insert into public.ai_sources (domain, name, trust_level, category) values
  -- Trust 1: government / verification
  ('dubailand.gov.ae',        'Dubai Land Department (DLD) / Dubai REST', 1, 'government'),
  ('dubai2040.ae',            'Dubai 2040 Urban Master Plan',             1, 'government'),
  -- Trust 2: official developers
  ('emaar.com',               'Emaar',                 2, 'developer'),
  ('dubaiholding.com',        'Dubai Holding Real Estate', 2, 'developer'),
  ('meraas.com',              'Meraas',                2, 'developer'),
  ('nakheel.com',             'Nakheel',               2, 'developer'),
  ('damacproperties.com',     'DAMAC Properties',      2, 'developer'),
  ('sobharealty.com',         'Sobha Realty',          2, 'developer'),
  ('binghatti.com',           'Binghatti',             2, 'developer'),
  ('ellingtonproperties.ae',  'Ellington Properties',  2, 'developer'),
  ('danubeproperties.ae',     'Danube Properties',     2, 'developer'),
  ('azizidevelopments.com',   'Azizi Developments',    2, 'developer'),
  ('nshama.ae',               'Nshama',                2, 'developer'),
  ('aldar.com',               'Aldar Properties',      2, 'developer'),
  ('majidalfuttaim.com',      'Majid Al Futtaim / Tilal Al Ghaf', 2, 'developer'),
  ('omniyat.com',             'Omniyat',               2, 'developer'),
  ('select-group.ae',         'Select Group',          2, 'developer'),
  ('samanadevelopers.com',    'Samana Developers',     2, 'developer'),
  ('object-1.com',            'Object 1',              2, 'developer'),
  ('reportagegroup.com',      'Reportage Properties',  2, 'developer'),
  ('arada.com',               'Arada',                 2, 'developer'),
  ('mag.global',              'MAG Property Development', 2, 'developer'),
  ('tigerproperties.ae',      'Tiger Properties',      2, 'developer'),
  ('imtiaz.ae',               'Imtiaz Developments',   2, 'developer'),
  ('dugasta.com',             'Dugasta Properties',    2, 'developer'),
  ('deyaar.ae',               'Deyaar',                2, 'developer'),
  ('wasl.ae',                 'Wasl Properties',       2, 'developer'),
  ('dubaiinvestments.com',    'Dubai Investments Real Estate', 2, 'developer'),
  -- Trust 3: portals / market data (discovery + comparison only)
  ('propertyfinder.ae',       'Property Finder',       3, 'portal'),
  ('bayut.com',               'Bayut',                 3, 'portal'),
  ('dxbinteract.com',         'DXBinteract',           3, 'portal'),
  ('propertymonitor.com',     'Property Monitor',      3, 'portal'),
  ('propsearch.ae',           'Propsearch',            3, 'portal'),
  ('dubizzle.com',            'Dubizzle Property',     3, 'portal'),
  -- Trust 4: news / market updates
  ('mediaoffice.ae',          'Dubai Media Office',    4, 'news'),
  ('zawya.com',               'Zawya Real Estate',     4, 'news'),
  ('gulfnews.com',            'Gulf News Property',    4, 'news'),
  ('arabianbusiness.com',     'Arabian Business',      4, 'news'),
  ('thenationalnews.com',     'The National',          4, 'news'),
  ('reuters.com',             'Reuters Middle East',   4, 'news'),
  ('khaleejtimes.com',        'Khaleej Times Property', 4, 'news'),
  ('constructionweekonline.com', 'Construction Week ME', 4, 'news'),
  ('meed.com',                'MEED',                  4, 'news'),
  -- Trust 5: training / regulation / agent knowledge
  ('drei.gov.ae',             'Dubai Real Estate Institute', 5, 'regulation'),
  ('uaelegislation.gov.ae',   'UAE Legislation Portal', 5, 'regulation'),
  ('dc.gov.ae',               'Dubai Courts',          5, 'regulation'),
  ('rdc.gov.ae',              'Rental Dispute Center', 5, 'regulation')
on conflict (domain) do nothing;

-- ---------- 3) ai_web_log: log of Ask Amber web-research turns ----------
create table if not exists public.ai_web_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id),
  user_name   text,
  user_role   text,
  query       text,
  used        boolean not null default false,   -- did the model actually call web search
  domains     int,                              -- how many approved domains were in scope
  created_at  timestamptz not null default now()
);
alter table public.ai_web_log enable row level security;
drop policy if exists ai_web_log_insert on public.ai_web_log;
create policy ai_web_log_insert on public.ai_web_log for insert to authenticated with check ( user_id = auth.uid() );
drop policy if exists ai_web_log_read on public.ai_web_log;
create policy ai_web_log_read on public.ai_web_log for select to authenticated using ( public.is_master() );
create index if not exists idx_ai_web_log_created on public.ai_web_log (created_at desc);

-- ---------- 4) Golden Visa knowledge (careful, verify-first wording) ----------
-- Master Admin can edit/replace these in the AI Knowledge Base afterwards.
insert into public.ai_knowledge (title, category, content, status, priority, visibility, source)
select * from (values
  ('Golden Visa — Property Eligibility (overview)', 'Golden Visa',
   'Property investors in Dubai may be eligible for a UAE Golden (long-term) residence visa subject to current government requirements, which can change. Treat any specific investment threshold, property type, mortgage or off-plan condition as something to VERIFY against official sources (DLD / Dubai REST / UAE government) before promising anything to a client. Do not quote a fixed AED threshold as guaranteed; say it is "subject to current rules" and offer to verify the client''s specific case.',
   'active', 1, 'agent_ok', 'Seed — verify via official UAE/DLD sources'),
  ('Golden Visa — Documents (typical)', 'Golden Visa',
   'Clients typically need: passport copy, title deed / proof of property ownership from DLD, Emirates ID (if applicable), passport photo, and proof of funds where required. Exact document lists and fees change — confirm the current checklist with the official authority or an approved immigration/legal advisor before telling the client this is final.',
   'active', 2, 'agent_ok', 'Seed — verify current checklist'),
  ('Golden Visa — Client Script (safe)', 'Golden Visa',
   'Suggested safe framing for clients: "Buying qualifying property in Dubai can put you on the path to a long-term Golden Visa, subject to the current UAE requirements. I''ll help you confirm exactly what your purchase qualifies for through the official process before we proceed." Position the visa as a benefit/path, never as an automatic or guaranteed outcome.',
   'active', 2, 'agent_ok', 'Seed — sales framing'),
  ('Golden Visa — Do Not Say (compliance)', 'Golden Visa — Do Not Say',
   'NEVER tell a client they "will definitely get" or "are guaranteed" a Golden Visa. Never quote eligibility thresholds, fees, or timelines as fixed/final unless verified from an official source for that client. Never give legal or immigration guarantees. Always recommend confirming eligibility with the official authority or an approved immigration/legal advisor before any promise.',
   'active', 1, 'all', 'Seed — compliance guardrail')
) as v(title, category, content, status, priority, visibility, source)
where not exists (select 1 from public.ai_knowledge k where k.category in ('Golden Visa','Golden Visa — Do Not Say'));
