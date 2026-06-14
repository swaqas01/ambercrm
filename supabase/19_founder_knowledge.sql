-- 19_founder_knowledge.sql
-- Amber Homes — Founder's Knowledge seed (founder-level market & strategy guidance for Ask Amber).
-- Authored from the founder document outline (27 topics). Internal VIEW, not guaranteed market fact.
-- SAFE & IDEMPOTENT: inserts only titles that do not already exist; re-running adds nothing, never
-- duplicates and never overwrites Master-Admin edits. Deletes/replaces nothing.
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- category='Founder''s Knowledge', status=active, priority=1 (High), source='Founder Internal View'.
-- visibility per row: agent_ok = agent-visible / Ask Amber usable; admin_only = internal only.
-- added_by = saad@amberhomes.ae (if that profile exists). Total entries: 27

insert into public.ai_knowledge (title, category, content, tags, visibility, status, priority, source, added_by)
select v.title, $kb$Founder's Knowledge$kb$, v.content, v.tags, v.visibility, $kb$active$kb$, 1, $kb$Founder Internal View$kb$,
       (select id from public.profiles where lower(email) = $kb$saad@amberhomes.ae$kb$ limit 1)
from (values
  ($kb$Founder — Dubai Market Cycles$kb$,$kb$Amber Homes internal view: Dubai property moves in cycles, not a straight line — phases of rapid launch and price discovery, then consolidation, then selective strength. Every cycle has winners and laggards; location, developer and entry price decide which side a unit lands on.
Positioning: sell the cycle logic, not hype. A good asset bought at the right entry price tends to hold through a softer phase; an overpriced unit in a weak location struggles even in a strong phase.
Ideal buyer: medium-to-long-term investors who understand timing matters.
Risk: never tell a client a cycle direction is guaranteed; cycles can extend or turn faster than expected.
Say: 'Dubai moves in cycles — the key is buying the right asset at the right entry price so you are resilient through any phase.' Do not say: 'Prices only go up' or 'Dubai never goes down.'
Call angle: ask the holding period first, then frame the cycle around it.$kb$,$kb$dubai market cycles, market timing, entry price, founder, investment strategy$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Dubai After COVID$kb$,$kb$Amber Homes internal view: post-COVID, Dubai re-rated structurally — population growth, safe-haven demand, residency reforms and lifestyle migration broadened the buyer base from pure investors to genuine end-users and relocators. This made quality communities, villas/townhouses and waterfront more durable.
Positioning: explain that today's demand has a real end-user backbone, not only speculation — a strength, but it also means buyers are more selective and value-driven.
Ideal buyer: relocating families, long-term residents, and investors who want real occupier demand behind their asset.
Say: 'Demand today is broader and more end-user driven than before, which supports good communities.' Do not claim the post-COVID run guarantees future appreciation.
Next action: qualify whether the client is investing or relocating — it changes what you recommend.$kb$,$kb$dubai after covid, post covid, end-user demand, relocation, founder, market shift$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Developer Positioning: Emaar$kb$,$kb$Amber Homes internal view: Emaar is the benchmark master-developer — Downtown, Dubai Hills, Dubai Creek Harbour, Emaar Beachfront. Strengths: delivery track record, community management, resale liquidity and brand trust, making it a relatively safer core allocation for cautious buyers.
Positioning: lead with delivery certainty, community quality and resale depth; use Emaar as the anchor option when a client wants lower execution risk.
Ideal buyer: first-time Dubai buyers, end-users, and conservative investors who prioritise liquidity and trust over maximum upside.
Risk: Emaar pricing is often premium — justify it with quality and liquidity, and still verify current price/availability.
Say: 'Emaar is a proven master-developer with strong resale demand.' Do not promise specific appreciation or rental yield.$kb$,$kb$emaar, developer positioning, downtown, dubai hills, creek harbour, beachfront, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Developer Positioning: Meraas$kb$,$kb$Amber Homes internal view: Meraas is the premium lifestyle and design-led developer — City Walk, Bluewaters, Jumeirah, Dubai Holding communities. Strengths: distinctive destinations, lifestyle branding and prime locations that appeal to design-conscious and luxury buyers.
Positioning: sell location prestige, lifestyle and scarcity of well-placed Meraas stock; use Meraas when the client values address, design and exclusivity.
Ideal buyer: luxury end-users, lifestyle buyers, and investors targeting premium tenant profiles.
Risk: premium entry pricing — entry-price discipline matters even more here; verify availability and service charges.
Say: 'Meraas builds lifestyle destinations in prime locations.' Do not guarantee resale premium or rental performance.$kb$,$kb$meraas, developer positioning, city walk, bluewaters, jumeirah, dubai holding, lifestyle, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Developer Positioning: Nakheel$kb$,$kb$Amber Homes internal view: Nakheel is the waterfront and master-community developer — Palm Jumeirah, Palm Jebel Ali, Dubai Islands and large established communities. Strength: ownership of iconic waterfront land and scarcity assets that are hard to replicate.
Positioning: lead with waterfront scarcity and master-planning scale; use Nakheel when the client wants a long-term waterfront or destination story.
Ideal buyer: long-term waterfront and luxury buyers who understand staged destination growth.
Risk: some Nakheel destinations are early-stage — frame them as long-term, never as quick flips, and verify current pricing/availability.
Say: 'Nakheel controls some of Dubai's most iconic waterfront land.' Do not promise the next Palm will repeat Palm Jumeirah's exact journey.$kb$,$kb$nakheel, developer positioning, palm jumeirah, palm jebel ali, dubai islands, waterfront, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Palm Jumeirah vs Palm Jebel Ali$kb$,$kb$Amber Homes internal view: Palm Jumeirah is the mature, proven waterfront icon with deep resale and rental demand. Palm Jebel Ali is the next-generation waterfront story at a much earlier stage — larger and newer, with long-term potential but earlier execution risk.
Positioning: Palm Jumeirah = established prestige and liquidity now; Palm Jebel Ali = long-term scarcity play for patient capital, compared to Palm Jumeirah's early journey but NOT promised to repeat it.
Ideal buyer: Palm Jumeirah for buyers wanting maturity and income; Palm Jebel Ali for long-horizon luxury/waterfront buyers.
Risk: Palm Jebel Ali is early-stage — availability and pricing must be verified; avoid speculation-only framing.
Suggested WhatsApp: 'Palm Jumeirah is already mature; Palm Jebel Ali is the next major waterfront story at an earlier stage. For a serious long-term buyer it can be very interesting — I would not position it for short-term speculation. What is your holding period?'
Do not say Palm Jebel Ali will definitely appreciate like Palm Jumeirah.$kb$,$kb$palm jumeirah, palm jebel ali, waterfront, comparison, scarcity, founder, client script$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Palm Central Private Residences$kb$,$kb$Amber Homes internal view: treat Palm Central / Private Residences-type stock as scarcity-led waterfront product — the pitch is location, exclusivity and limited supply rather than volume. Suits buyers who value address and privacy over price-per-foot bargains.
Positioning: emphasise limited inventory, prime positioning and lifestyle; frame as a considered long-term hold.
Ideal buyer: high-net-worth end-users and long-term luxury investors.
Risk: thin supply means pricing must be checked carefully and compared; do not create false urgency or quote allocation as guaranteed.
Say: 'This is limited, scarcity-led waterfront product.' Do not say allocation or a specific unit is guaranteed before it is confirmed in writing.
Call angle: confirm lifestyle priorities and holding period, then verify live availability before promising anything.$kb$,$kb$palm central, private residences, waterfront, scarcity, luxury, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Dubai Islands$kb$,$kb$Amber Homes internal view: Dubai Islands (Nakheel) is an emerging waterfront master-destination — beachfront, hospitality and community components positioned as a long-term lifestyle and investment story with early-stage upside and corresponding timing considerations.
Positioning: sell the master-plan vision, beachfront access and early-entry logic — as a long-term play, not a quick flip.
Ideal buyer: long-term investors and lifestyle buyers comfortable with a developing destination.
Risk: phasing and delivery timelines matter; verify current release pricing and availability and avoid guaranteeing handover dates.
Say: 'Dubai Islands is an emerging beachfront master-destination with long-term potential.' Do not promise specific ROI or completion timing.$kb$,$kb$dubai islands, nakheel, waterfront, emerging, beachfront, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Commercial Real Estate$kb$,$kb$Amber Homes internal view: Dubai commercial (offices, retail, logistics) has become a real opportunity as occupier demand and limited quality Grade-A supply support the segment. Suits investors seeking diversification and potentially different yield dynamics from residential.
Positioning: frame commercial as a diversification and income-stability play for the right investor, backed by occupier demand — always subject to verification of specific yields and tenancy.
Ideal buyer: experienced/institutional-minded investors, business owners buying their own premises, and portfolio diversifiers.
Risk: commercial is less liquid and more tenant/lease dependent than residential — never quote a yield as guaranteed.
Say: 'Quality commercial space is in demand and can diversify a portfolio.' Do not promise occupancy or returns.$kb$,$kb$commercial real estate, offices, retail, logistics, yield, diversification, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — What Has Outperformed$kb$,$kb$Amber Homes internal view: through recent cycles the consistent outperformers have tended to be prime waterfront, quality villas/townhouses in established master-communities, and well-located stock from trusted developers bought at sensible entry prices. Scarcity + end-user demand + delivery certainty is the recurring pattern.
Positioning: guide clients toward these durable categories rather than chasing the cheapest or most hyped launch.
Ideal buyer: investors who want resilience and real demand behind the asset.
Risk: past outperformance is not a promise of future returns — frame as a pattern, not a guarantee.
Say: 'Prime, scarce, well-located assets bought at the right price have tended to hold up best.' Do not say these categories are guaranteed to keep rising.$kb$,$kb$outperformed, villas, townhouses, waterfront, scarcity, founder, investment strategy$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — What Has Underperformed$kb$,$kb$Amber Homes internal view: the recurring laggards have tended to be oversupplied generic apartment stock in weaker locations, units bought at inflated entry prices, and projects from developers with weak delivery or community management. These struggle most in softer phases.
Positioning: use this honestly to steer clients away from poor value — it builds trust and protects them.
Ideal buyer: every buyer benefits from avoiding these traps.
Risk: do not name-shame specific projects to clients; speak in categories and fundamentals.
Say: 'Oversupplied, generic, overpriced units in weak locations carry more risk.' Do not disparage a competitor developer by name or guarantee any specific project will fall.$kb$,$kb$underperformed, oversupply, entry price, risk, founder, investment strategy$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Entry Price Rule$kb$,$kb$Amber Homes internal view: entry price is the single most important discipline. A great location or developer bought too expensively can still be a poor investment; an average asset at a genuinely good entry price can outperform. Always compare price-per-foot and payment terms against real comparables before recommending.
Positioning: make entry-price discipline the backbone of your advice — it is the most defensible, compliant thing you can emphasise.
Ideal buyer: all investors, especially value-driven buyers in a selective market.
Say: 'Entry price is critical — let us compare this against real comparables before you commit.' Do not promise upside to justify overpaying.
Call angle: ask what comparables the client has seen, then position your option on value, not hype.$kb$,$kb$entry price, value, price per foot, comparables, founder, investment strategy$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Current Market Phase$kb$,$kb$Amber Homes internal view (refresh in each weekly update): the market is currently more selective and value-driven — buyers compare carefully, want genuine quality, and reward strong developer/location logic over hype. This favours well-priced quality stock and disciplined advice.
Positioning: in a selective phase, win by comparing options properly, explaining entry price, and showing strong developer/location logic — avoid pressure tactics.
Ideal buyer: discerning investors and end-users who respond to substance.
Risk: this is a point-in-time read; refresh it with each weekly founder update and do not present the phase as permanent or guaranteed.
Say: 'The market is selective right now — value and quality win.' Do not say the market is guaranteed to accelerate or slow on a fixed date.$kb$,$kb$current market phase, selective market, value, founder, market update$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Supply and Launch Slowdown$kb$,$kb$Amber Homes internal view: when launch activity slows or supply tightens in a segment, well-located existing stock can become relatively more attractive; when a launch wave hits, buyers gain choice and pricing power. Read supply per segment and location, not as one blanket number.
Positioning: use supply dynamics to justify timing and selection — scarcity in a segment supports a considered purchase now; a wave means compare harder.
Ideal buyer: investors who value timing and selection logic.
Risk: never guarantee a wave or slowdown will arrive on a specific timeline — frame as current market information subject to change.
Say: 'Supply varies by segment, which affects choice and pricing.' Do not say the launch wave is guaranteed for a specific month.$kb$,$kb$supply, launch slowdown, launch wave, timing, founder, market update$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Construction Cost Logic$kb$,$kb$Amber Homes internal view: rising construction and land costs generally put a floor under new-launch pricing — it becomes harder for developers to launch quality product cheaply. This supports the logic that well-built, well-located new stock is unlikely to get materially cheaper to produce.
Positioning: use cost logic to explain why quality launches are priced where they are, and why genuine value entry points are worth acting on — without promising price rises.
Ideal buyer: investors who want to understand the reasoning behind pricing.
Risk: cost logic explains pricing pressure, not guaranteed appreciation; keep it as context, not a promise.
Say: 'Construction and land costs make it hard to build quality cheaply, which supports pricing.' Do not say costs guarantee your unit will rise in value.$kb$,$kb$construction cost, land cost, pricing logic, replacement cost, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — End-User Market Shift$kb$,$kb$Amber Homes internal view: a larger share of demand now comes from genuine end-users — families and residents who buy to live, not just to flip. This deepens demand for quality layouts, communities, schools, villas/townhouses and lifestyle locations, and makes those segments more resilient.
Positioning: for end-users sell layout, community, schools, privacy and lifestyle; for investors highlight that real end-user demand supports the asset.
Ideal buyer: relocating families and long-term residents; investors targeting end-user-backed stock.
Say: 'Real families are buying to live here, which supports good communities.' Do not assume every client is an investor — qualify use first.
Next action: confirm investment vs personal use before pitching.$kb$,$kb$end-user shift, families, communities, schools, lifestyle, founder, market shift$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Townhouse Demand$kb$,$kb$Amber Homes internal view: townhouses are a structurally important segment — they serve growing families wanting space, community and privacy at a more accessible price than villas. Demand has been strong in well-planned communities with amenities and schools.
Positioning: prioritise townhouse leads; guide family clients toward space, community, privacy and schools; prepare a dedicated townhouse script.
Ideal buyer: families and end-users upgrading from apartments; investors targeting family-tenant demand.
Risk: still verify community-specific pricing, service charges and handover; avoid guaranteeing rental demand.
Say: 'Townhouses give families space and community at an accessible entry point.' Suggested WhatsApp: 'If space, privacy and a family community matter, a townhouse in the right community is worth comparing — shall I send 2-3 options that fit your budget?'$kb$,$kb$townhouse, family, community, space, demand, founder, sales guidance$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Villa Demand$kb$,$kb$Amber Homes internal view: villas, especially in established and prime communities, have been a durable outperformer — driven by scarcity of quality villa land, family migration and lifestyle demand. They suit buyers prioritising space, privacy and a long-term hold.
Positioning: sell scarcity, lifestyle and long-term resilience; for investors emphasise limited quality supply and strong end-user demand.
Ideal buyer: affluent families, relocators, and long-term investors.
Risk: villa pricing varies widely by community and plot — compare carefully and verify; never promise appreciation.
Say: 'Quality villas are genuinely scarce, which supports the segment.' Suggested WhatsApp: 'Quality villa land is limited, which is why this segment stays in demand. Want me to compare a few options on value and community for you?'$kb$,$kb$villa, scarcity, family, lifestyle, demand, founder, sales guidance$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Waterfront Investment Logic$kb$,$kb$Amber Homes internal view: waterfront remains a structurally strong category because genuine waterfront land is finite — but entry price still decides the outcome. Scarcity supports demand; overpaying erodes returns.
Positioning: explain scarcity and lifestyle appeal, then anchor on entry price and developer/location comparison; give client-safe wording and avoid guarantees.
Ideal buyer: long-term luxury and lifestyle buyers; investors targeting premium tenants.
Risk: some waterfront destinations are early-stage — frame as long-term; verify current pricing/availability.
Say: 'Waterfront land is finite, which supports demand — but entry price is critical.' Suggested WhatsApp: 'Waterfront is scarce by nature, but the entry price still decides your outcome — let us compare options properly before you commit.' Do not say waterfront is guaranteed to appreciate.$kb$,$kb$waterfront, scarcity, entry price, luxury, founder, investment strategy, client script$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Abu Dhabi Market Overview$kb$,$kb$Amber Homes internal view: Abu Dhabi has emerged as a serious complementary market — investment-zone freehold, strong government-backed master-developers, and newer island destinations attracting both end-users and investors. Can suit buyers wanting a different risk/value profile from Dubai.
Positioning: present Abu Dhabi as a credible diversification or value option, not a competitor to dismiss; match it to the client's goal (lifestyle, value, residency).
Ideal buyer: investors diversifying from Dubai, and buyers attracted to newer island/master-planned destinations.
Risk: liquidity and rental dynamics differ from Dubai — verify specifics; never guarantee yields.
Say: 'Abu Dhabi offers a credible, often value-driven alternative with strong master-developers.' Compare Dubai vs Abu Dhabi on the client's actual goal, not bias.$kb$,$kb$abu dhabi, market overview, freehold, investment zones, diversification, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Hudayriyat and Modon$kb$,$kb$Amber Homes internal view: Hudayriyat Island (Modon) is a lifestyle-led Abu Dhabi destination — sport, leisure, beachfront and premium community living. Frame it as an emerging lifestyle and long-term investment story.
Positioning: lead with lifestyle, amenities and master-plan vision; treat as a considered long-term hold rather than a flip.
Ideal buyer: lifestyle end-users and long-term investors interested in Abu Dhabi's newer destinations.
Risk: emerging destination — verify release pricing, phasing and handover; avoid guaranteeing timelines or returns.
Say: 'Hudayriyat is a lifestyle-led island destination with long-term potential.' Do not promise specific appreciation or completion dates.$kb$,$kb$hudayriyat, modon, abu dhabi, lifestyle, island, emerging, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Aldar and Yas Island$kb$,$kb$Amber Homes internal view: Aldar is Abu Dhabi's flagship master-developer with a strong delivery record; Yas Island is its proven lifestyle-and-entertainment destination (theme parks, leisure, waterfront). Together they offer relatively lower-execution-risk Abu Dhabi exposure with lifestyle pull.
Positioning: use Aldar/Yas as the anchor Abu Dhabi option for buyers wanting trusted delivery plus lifestyle and tourism-backed demand.
Ideal buyer: end-users and investors wanting credible delivery and a lifestyle/tourism story.
Risk: verify current pricing, service charges and availability; do not guarantee rental performance from tourism.
Say: 'Aldar is a proven master-developer and Yas Island is an established lifestyle destination.' Do not promise yields or appreciation.$kb$,$kb$aldar, yas island, abu dhabi, master developer, lifestyle, tourism, founder$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Agent Usage Rules$kb$,$kb$Amber Homes internal view (how agents should use founder guidance): use Founder's Knowledge as your senior-advisor backbone — lead with the founder view, then qualify the client (budget, purpose, type, area, timeline, residency need), then recommend by fit and entry price, not hype. Always end with a clear next step (call, shortlist, viewing, EOI).
Rules: keep messages premium and short; compare options honestly; explain entry price; never pressure.
Compliance: never guarantee ROI, appreciation, visa, allocation or availability — use 'subject to verification/availability' and 'based on current market information'.
Say: 'Based on our internal view...' then give practical, client-safe guidance. Do not present internal opinion as guaranteed fact.$kb$,$kb$agent usage rules, how to use, advisory, compliance, founder, sales guidance$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Client Scripts$kb$,$kb$Amber Homes internal view — ready client scripts (adapt, never guarantee).
Buy now or wait: 'The right asset at the right entry price matters more than timing the whole market. Let us compare value — if a strong option at a sensible price appears, waiting rarely helps.'
Is it a good investment: 'It can be, if the entry price and location are right — let me compare it against real comparables before you commit.'
After a slowdown: 'A more selective market is actually good for serious buyers — more room to compare and negotiate on value.'
Waterfront: 'Waterfront is scarce by nature, but entry price still decides your outcome.'
Always close with a question: holding period, budget range, or investment vs personal use. Never promise ROI, visa or appreciation.$kb$,$kb$client scripts, objection handling, buy or wait, whatsapp, founder, sales guidance$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Property Matching Logic$kb$,$kb$INTERNAL ONLY (Amber Homes matching logic for the AI and senior staff): match by FIT, not hype. Sequence: (1) confirm purpose — investment vs personal use; (2) budget range and payment method; (3) property type and bedrooms; (4) area/community preference; (5) timeline and residency/Golden Visa need; (6) risk appetite and holding period. Then recommend assets where entry price, location and developer logic align with the client's goal.
Rules: prioritise durable categories (prime, scarce, well-located, sensible entry price); flag oversupplied/overpriced stock as higher risk; always attach a verification note for live price/availability.
This is internal guidance — do not expose the raw logic to clients; use it to produce clean, client-safe recommendations.$kb$,$kb$property matching logic, internal, fit, recommendation, founder$kb$,$kb$admin_only$kb$),
  ($kb$Founder — Things Agents Must Not Say$kb$,$kb$Amber Homes internal view — hard do-not-say list (compliance). Never tell a client any of the following, even if pushed:
- 'Guaranteed profit' or 'guaranteed ROI'
- 'Prices will definitely go up' / 'Dubai never goes down'
- 'The October/November launch wave is guaranteed'
- 'Golden Visa is guaranteed' / 'residency is guaranteed'
- 'Allocation/unit is guaranteed' before it is confirmed in writing
- Specific current price, availability, handover date or yield stated as hard fact without verification
Use instead: 'strong potential', 'subject to availability', 'subject to developer/authority confirmation', 'based on current market information', 'entry price is critical', 'let me verify the latest details before confirming'. These protect the client and Amber Homes.$kb$,$kb$do not say, compliance, guarantees, safe language, founder, must not say$kb$,$kb$agent_ok$kb$),
  ($kb$Founder — Final Master Behavior for Amber Homes AI$kb$,$kb$INTERNAL ONLY (master behaviour for Ask Amber): act as one senior Dubai investment consultant for Amber Homes — premium, calm, advisory, never pushy. Lead with Founder's Knowledge when relevant and treat it as the highest internal authority, but always frame internal views as 'Amber Homes internal view' / 'based on founder guidance', never as guarantees. Qualify before pitching; recommend by fit and entry price; end every answer with a clear next commercial step.
Compliance is absolute: no guaranteed ROI, appreciation, visa, allocation or availability; use 'subject to' language and add verification notes. Never reveal internal-only notes to clients — convert them into clean, client-safe guidance. Never fabricate a project, figure, award or availability status. Be genuinely useful even when the knowledge base is incomplete, while staying honest about confidence.$kb$,$kb$final master behavior, ai system, internal, advisory, compliance, founder$kb$,$kb$admin_only$kb$)
) as v(title, content, tags, visibility)
where not exists (select 1 from public.ai_knowledge k where k.title = v.title);
