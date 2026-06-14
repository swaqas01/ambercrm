-- 21_launch_focus_seed.sql
-- Amber Homes — Founder's Knowledge: current Upcoming Launch Focus (weekly launch priorities for Ask Amber).
-- Founder Internal VIEW; pricing & exact launch dates need verification. SAFE & IDEMPOTENT: inserts the
-- entry only if the title does not already exist; re-running adds nothing and overwrites nothing.
-- HOW TO RUN: Supabase -> SQL Editor -> paste -> Run. category='Founder''s Knowledge', visibility=agent_ok
-- (agent-visible + Ask Amber usable), priority=1, source='Founder Internal View'. added_by = saad@amberhomes.ae.

insert into public.ai_knowledge (title, category, content, tags, visibility, status, priority, source, added_by)
select $kb$Upcoming Launches and Projects Agents Should Focus On$kb$, $kb$Founder's Knowledge$kb$, $kb$Amber Homes weekly launch focus (Founder Internal View — pricing and exact launch dates NEED VERIFICATION before sharing with clients). These are the launches agents should prioritise now. For each: lead with the buyer profile and pitch angle, and always verify final EOI/price/payment-plan/launch-date/availability with the developer before sending anything to a client. Do not present this internal view as official developer confirmation.

1) Palm Central — Nakheel — Palm Jebel Ali.
Status: collecting EOIs; launch expected this month (verify). Best buyer: clients interested in Palm Jebel Ali, waterfront apartments, long-term capital appreciation, Golden Visa entry, and clients priced out of Palm Jebel Ali villas. Why it matters: waterfront scarcity on Palm Jebel Ali at apartment entry points. Pitch angle: position as a long-term Palm Jebel Ali waterfront entry; don't promise appreciation. Verify: latest EOI amount, exact launch date, starting price, payment plan and availability.

2) Yas Orchid — Aldar — Yas Island, Abu Dhabi.
Status: expected to launch (verify). Best buyer: clients interested in Abu Dhabi, Aldar, Yas Island, family communities, long-term end-user demand and Abu Dhabi growth. Why it matters: Aldar family community on Yas Island with strong end-user demand. Pitch angle: compare with existing Yas Island communities (Yas Acres, Yas Park Gate, Yas Park Views). Verify: official name, launch details, prices, payment plan, handover and availability.

3) Al Ghadeer Gardens — developer to verify — near the Dubai–Abu Dhabi border (Al Maktoum Airport / Dubai South direction).
Status: expected (verify). Best buyer: clients looking at affordable family living, Dubai–Abu Dhabi connectivity, the airport/infrastructure growth story and long-term growth. Why it matters: affordable family community on the Dubai–Abu Dhabi corridor. Pitch angle: lead on connectivity and the future airport/infrastructure story. Verify: developer, official project name, pricing, payment plan, launch status and exact location.

4) Raw District — Imtiaz — Sheikh Zayed Road.
Status: launched (verify details). Best buyer: clients interested in Sheikh Zayed Road, central Dubai, branded/lifestyle urban projects and investment exposure in a prime corridor. Why it matters: branded/lifestyle apartments on a prime central corridor. Pitch angle: prime SZR location plus lifestyle branding for central-Dubai investors. Verify: pricing, unit types, payment plan, handover and availability.

5) Hayat Townhouses — developer to verify — Dubai South.
Status: launching townhouses in Dubai South (verify). Best buyer: clients interested in townhouses, family living, Dubai South, Al Maktoum Airport growth, long-term end-user demand and affordable family community options. Why it matters: townhouses in Dubai South aligned to airport-led growth. Pitch angle: match to townhouse/family leads wanting space, community and future growth. Verify: developer details, official name, pricing, payment plan, handover and availability.

6) Emaar existing stock — Emaar — Dubai Hills, Emaar South, The Valley, The Oasis, Dubai Creek Harbour, Downtown and other Emaar communities.
Status: ready/available inventory (verify per community). Best buyer: clients who want developer trust, resale liquidity, family communities and safer long-term positioning. Why it matters: don't ignore available Emaar inventory — it remains strong for trust and resale. Pitch angle: match Emaar stock to clients by community depending on availability. Verify: live availability and pricing per community.

7) Binghatti Wraith — Binghatti — Al Jaddaf.
Status: launching in Al Jaddaf (verify). Best buyer: clients interested in Al Jaddaf, Business Bay/Downtown proximity, branded architecture, central location and apartment investment. Why it matters: branded architecture in a central location near Business Bay/Downtown. Pitch angle: central Al Jaddaf plus Binghatti branded architecture for apartment investors. Verify: official launch details, pricing, payment plan, unit mix, handover and availability.

Founder instruction: do not answer upcoming-launch questions generically or with random supply statistics. Use this launch focus first, give agents an actionable pitch per project, and then offer to match these launches to the agent's own leads (by area, budget, client type, project/developer interest, lead temperature and timeline). Always keep verification notes; never promise guaranteed ROI, prices, allocation or exact launch dates.$kb$, $kb$upcoming launches, launch focus, what is launching, what to pitch, what to send clients, weekly founder update, palm central, palm jebel ali, nakheel, yas orchid, aldar, yas island, abu dhabi, al ghadeer gardens, dubai south, raw district, imtiaz, sheikh zayed road, hayat townhouses, emaar, binghatti wraith, al jaddaf$kb$, $kb$agent_ok$kb$, $kb$active$kb$, 1, $kb$Founder Internal View$kb$,
       (select id from public.profiles where lower(email) = $kb$saad@amberhomes.ae$kb$ limit 1)
where not exists (select 1 from public.ai_knowledge k where k.title = $kb$Upcoming Launches and Projects Agents Should Focus On$kb$);
