# Generates supabase/17_knowledge_seed.sql from a structured list of entries.
# Premium, compliant, keyword-rich. Idempotent (insert only titles not already present).
# Each entry: (title, category, content, tags)

E = []
def add(title, category, content, tags):
    E.append((title.strip(), category.strip(), " ".join(content.split()), tags.strip()))

# ============ 1. AI BEHAVIOR RULES ============
C = "AI Behavior Rules"
add("AI Behavior — Purpose of the Knowledge Base", C,
    "This knowledge base powers Ask Amber for the Amber Homes team. It exists so every WhatsApp reply, call script, objection response and explanation sounds like one senior Dubai investment consultant: premium, calm, advisory and compliant. Always pull the right entry for the question and keep the answer short and usable.",
    "ai behavior, purpose, knowledge base, ask amber")
add("AI Behavior — Core Behaviour (Advisory, Not Just Answers)", C,
    "Ask Amber behaves like a senior Dubai real estate investment consultant. Do not only answer the question — move the client toward the next commercial step: a call, Zoom, office meeting, site visit, project presentation, shortlist discussion, EOI, booking, follow-up or close. Sound premium, calm and confident. Never desperate or pushy.",
    "ai behavior, advisory, next step, consultant")
add("AI Behavior — Final Rules for WhatsApp", C,
    "On WhatsApp: keep messages short and premium. Lead with value, not brochures. Ask one or two smart qualifying questions, then propose a clear next step (usually a short call). Never send walls of text. Never guarantee ROI, visa approval, appreciation, discounts, allocation or availability. When unsure, say you will verify the latest details before confirming.",
    "ai behavior, whatsapp, rules, qualifying, next step")
add("AI Behavior — Safe Language Bank", C,
    "Use protective wording on anything not 100% confirmed: 'subject to availability', 'subject to developer confirmation', 'subject to authority approval', 'based on current market information', and 'let me verify the latest details before confirming'. These keep Amber Homes credible and protect the client.",
    "ai behavior, safe language, subject to, compliance")
add("Master Prompt — AI System Behaviour", C,
    "You are a senior Dubai property investment advisor for Amber Homes. Be premium, calm, confident and advisory — never pushy. Qualify before you pitch. Recommend by fit (budget, purpose, type, area, timeline, payment, Golden Visa need, risk appetite), not by hype. Never guarantee returns, visa or availability; use 'subject to' language. Every answer should end with a clear next commercial step.",
    "master prompt, ai system behavior, advisory, compliance")

# ============ 2. WHATSAPP NEW LEAD RESPONSES ============
C = "WhatsApp New Lead Responses"
add("WhatsApp — New Off-Plan Lead First Response", C,
    "Standard: 'Hello [Name], thank you for your interest in Dubai off-plan investment. I'm [Agent] from Amber Homes. To recommend the right project and payment plan, may I ask your budget range and whether this is for investment or personal use? A quick 5-minute call is the fastest way — when suits you today?' "
    "Short: 'Hi [Name], [Agent] from Amber Homes. Quick question so I send the right options — budget range and investment or personal use? Happy to call when you're free.'",
    "whatsapp, new lead, off-plan, first response, call booking")
add("WhatsApp — New Lead When Project Name Is Unknown", C,
    "'Hello [Name], thank you for reaching out to Amber Homes. So I can shortlist the right options for you, may I confirm three things: your budget range, investment or personal use, and any preferred area or community? Once I have these I'll send a focused shortlist — or we can do a quick call and I'll guide you live.'",
    "whatsapp, new lead, unknown project, qualifying, shortlist")
add("WhatsApp — New Lead From Website or Social Media", C,
    "'Hi [Name], thanks for your enquiry through our website. I'm [Agent] at Amber Homes — we advise investors and end-users on Dubai property. To point you to the right opportunities, could you share your budget and whether you're looking at investment or personal use? A short call today would let me tailor this properly.'",
    "whatsapp, new lead, website, social media, enquiry")
add("WhatsApp — New Lead From Instagram or Facebook Ad", C,
    "'Hi [Name], thank you for responding to our Dubai property campaign. I'm [Agent] from Amber Homes. The projects we shared move quickly, so a quick call helps me match you to current availability — but first, what's your budget range and is this for investment or to live in?'",
    "whatsapp, new lead, instagram, facebook, ad, campaign")
add("WhatsApp — New Lead From Property Portal", C,
    "'Hello [Name], you enquired about a Dubai property listing — thank you. I'm [Agent] at Amber Homes. That unit may have similar or stronger alternatives depending on your goal, so may I confirm your budget and whether it's for investment or personal use? I'll then send the best current options, subject to availability.'",
    "whatsapp, new lead, portal, bayut, property finder, listing")
add("WhatsApp — New Lead for Emaar / Meraas / Nakheel / Dubai Holding", C,
    "'Hello [Name], great choice looking at [Emaar/Meraas/Nakheel/Dubai Holding]. Amber Homes works closely with the leading Dubai developers. To recommend the right project, unit and payment plan, may I ask your budget and investment vs personal use? Current launches move fast, so a short call today is the best way to secure the right option, subject to availability.'",
    "whatsapp, new lead, emaar, meraas, nakheel, dubai holding")
add("WhatsApp — New Lead for DAMAC / Sobha / Binghatti / Other Developer", C,
    "'Hello [Name], thanks for your interest in [DAMAC/Sobha/Binghatti]. I'm [Agent] at Amber Homes — we compare developers objectively so you buy the right unit, not just the popular one. May I confirm your budget and whether this is investment or personal use? I'll then shortlist the strongest options for your goal.'",
    "whatsapp, new lead, damac, sobha, binghatti, developer")

# ============ 3. CALL CONVERSION SCRIPTS ============
C = "Call Conversion Scripts"
add("Call Conversion — Client Says 'Send Details'", C,
    "'Absolutely, I'll send focused details — but Dubai has hundreds of options and I don't want to flood you. Give me 3–4 minutes on a quick call so I understand your goal, then everything I send is relevant. Does now or in an hour work better?' If they insist on text first: send 2–3 tailored options, then propose the call again.",
    "call conversion, send details, whatsapp, objection")
add("Call Conversion — Client Says 'Just WhatsApp Me'", C,
    "'No problem, we can keep it on WhatsApp. To make sure I send the right thing and not generic brochures, two quick questions: budget range, and investment or personal use? And if anything looks interesting, a 5-minute call will save you hours of scrolling.'",
    "call conversion, just whatsapp, text only, qualifying")
add("Call Conversion — Client Does Not Want a Call", C,
    "'Completely understand — no pressure on a call. I'll work over WhatsApp. Just so I'm precise: what's your budget and goal? When you're ready, even a short voice note or call helps me secure the right unit before availability changes.'",
    "call conversion, no call, whatsapp, respect")
add("Call Conversion — Client Is Busy", C,
    "'Totally understand you're busy — that's exactly why a quick call saves time versus long messages. I'll keep it under 5 minutes and do the heavy lifting for you. What time later today or tomorrow works best?'",
    "call conversion, busy, time, schedule")
add("Call Conversion — Client Says 'Call Me Later'", C,
    "'Perfect — I'll call later. So the call is useful and not generic, what's your budget range and is this investment or personal use? Shall I call you around [suggest a time] today?'",
    "call conversion, call me later, schedule")
add("Call Conversion — Client Says 'Call Me Tomorrow'", C,
    "'Great, let's lock tomorrow. Morning or afternoon better for you? I'll prepare a focused shortlist for your budget and goal so the call is straight to the point.'",
    "call conversion, call me tomorrow, schedule")
add("Call Conversion — Client Asks 'Why Do You Need To Call?'", C,
    "'Fair question. A call lets me understand your goal in minutes, filter out the wrong options, and flag units that genuinely fit before they move. It saves you scrolling through dozens of listings — and there's zero obligation.'",
    "call conversion, why call, objection, value")
add("Call Conversion — Client Ready For Call", C,
    "'Excellent — I'll call you now/at [time]. Before we speak, have a rough budget and goal in mind (investment or personal use) and I'll bring the strongest current options for you, subject to availability.'",
    "call conversion, ready, confirm")

# ============ 4. CLIENT QUALIFICATION ============
C = "Client Qualification"
add("Qualification — Investment vs Personal Use", C,
    "Ask early: 'Is this primarily an investment, or somewhere you plan to live?' Investment buyers care about yield, payment plan, exit and tenant demand; end-users care about layout, community, schools and lifestyle. The answer changes everything you recommend — never pitch before you know it.",
    "qualification, investment, personal use, purpose")
add("Qualification — Golden Visa Need", C,
    "Ask: 'Is UAE residency or the Golden Visa part of your goal?' If yes, steer toward property at or above the AED 2M threshold, subject to current rules and authority approval. Position the visa as a potential benefit of qualifying property, never as a guaranteed outcome.",
    "qualification, golden visa, residency, aed 2 million")
add("Qualification — Budget", C,
    "Ask for a range, not an exact figure: 'What budget range are you working with — for example 1–1.5M, 1.5–3M, or 3M+?' A range removes pressure and lets you shortlist correctly. Confirm whether the budget is cash, payment-plan-driven, or mortgage-based.",
    "qualification, budget, range, payment")
add("Qualification — Property Type", C,
    "Confirm the asset: apartment, townhouse, villa, penthouse or commercial. Then bedrooms and must-haves (view, layout, furnished). Type plus budget narrows the market fast and stops you sending irrelevant options.",
    "qualification, property type, apartment, villa, bedrooms")
add("Qualification — Timeline", C,
    "Ask: 'Are you looking to decide in the next few weeks, or exploring for later?' Near-term buyers get availability-focused options and a fast next step; longer-horizon buyers get education plus a structured follow-up. Match urgency to their timeline, don't fake it.",
    "qualification, timeline, urgency, decision")
add("Qualification — Rental Income vs Capital Appreciation", C,
    "Ask which matters more: steady rental income or long-term capital growth. Income-focused buyers favour ready, high-demand rental areas; growth-focused buyers consider off-plan in emerging or master-planned locations. Discuss both in general terms only — never promise a specific return.",
    "qualification, rental income, capital appreciation, yield")
add("Qualification — Ready vs Off-Plan", C,
    "Ask: 'Do you prefer something ready to use or rent now, or are you open to off-plan with a payment plan?' Ready suits immediate use/income and mortgage buyers; off-plan suits staged payments and entry pricing. Present both honestly based on their goal.",
    "qualification, ready, off-plan, payment plan")
add("Qualification — Luxury Buyer", C,
    "For high-budget clients, qualify on priorities: privacy, prime views, branded residence, developer prestige, finishing quality and long-term resale appeal. Luxury buyers value scarcity and discretion — keep the conversation consultative and unhurried.",
    "qualification, luxury, high net worth, scarcity, prestige")
add("Qualification — Overseas Buyer", C,
    "For overseas clients, confirm budget, goal, Golden Visa interest, and whether they can travel or need a remote process. Explain that buying remotely is common, outline the steps simply, and offer a Zoom walkthrough and video tours. Flag fees that need verification before any commitment.",
    "qualification, overseas buyer, remote, international, zoom")

# ============ 5. OBJECTION HANDLING ============
C = "Objection Handling"
add("Objection — 'I Am Just Checking'", C,
    "Reply: 'That's completely fine — most smart buyers start by exploring. Let me make your research efficient: a quick sense of your budget and goal and I'll show you what's genuinely worth watching, not everything.' Why it works: removes pressure, repositions you as a guide. Next action: soft-qualify, then offer a short call.",
    "objection, just checking, browsing, soft")
add("Objection — 'Dubai Prices Are Too High'", C,
    "Reply: 'Prices have moved, that's true — but Dubai still offers strong rental demand, no annual property tax and entry points other global cities can't match. The real question is value for your goal, not headline price. Let me show options that make sense at your budget.' Why it works: reframes price as value. Next action: shortlist by budget.",
    "objection, prices high, expensive, value, dubai market")
add("Objection — 'I Want To Wait'", C,
    "Reply: 'Waiting can be the right call — let's just make sure you're waiting with information, not guessing. I'll keep you updated on the right launches and price movements so when you're ready, you act with an edge.' Why it works: respects the decision, keeps you in the loop. Next action: set a structured follow-up.",
    "objection, want to wait, timing, follow-up")
add("Objection — 'Regional Conflict Makes Me Worried'", C,
    "Reply: 'I understand the caution. Dubai has historically been viewed as a safe, stable hub, and demand has stayed resilient — but I'd never dismiss your concern. Let's focus on quality assets in strong locations that hold value through cycles, and you decide at your pace.' Why it works: acknowledges, doesn't dismiss, no false promises. Next action: discuss resilient communities.",
    "objection, regional conflict, geopolitics, safety, stability")
add("Objection — 'Is Dubai A Bubble?'", C,
    "Reply: 'A fair question. Today's market has more end-user demand, stricter regulation and an escrow system protecting buyers, which is different from past cycles. No market only goes up, so selection matters — right developer, location and price. Let me show you assets chosen for durability, not hype.' Why it works: balanced, credible. Next action: compare quality options.",
    "objection, bubble, crash, market, regulation")
add("Objection — 'Dubai vs London or Europe'", C,
    "Reply: 'Both have merits. Versus London or Europe, Dubai typically offers higher gross rental yields, no annual property tax and no personal income tax, plus residency options — while Europe offers maturity and familiarity. For income and tax efficiency, Dubai is hard to beat. Shall I show a like-for-like comparison at your budget?' Why it works: respectful, fact-based. Next action: comparison call.",
    "objection, london, europe, comparison, yield, tax")
add("Objection — 'I Have Another Agent'", C,
    "Reply: 'No problem at all — and I won't step on anyone's toes. Think of me as a second opinion with strong developer access. If I can add value or surface a better-fit unit, great; if not, you've lost nothing.' Why it works: non-confrontational, value-led. Next action: offer a focused comparison.",
    "objection, another agent, loyalty, second opinion")
add("Objection — 'Another Agent Offered A Discount'", C,
    "Reply: 'Developer pricing and payment plans are generally standardised, so be a little careful with discount claims — sometimes it's a fee shift, not real savings. I'll be transparent on the full cost. Send me what they offered and I'll give you an honest read.' Why it works: protects the client, builds trust. Next action: review the offer.",
    "objection, discount, another agent, transparency, fees")
add("Objection — 'Can You Get Me A Discount?'", C,
    "Reply: 'I'll always push for the best available terms and any genuine incentives the developer is running — but I won't promise a discount that doesn't exist. What I can do is make sure you get the right unit, the best payment plan and full cost transparency.' Why it works: honest, still helpful. Next action: identify real incentives, subject to developer confirmation.",
    "objection, discount, incentive, payment plan, honesty")
add("Objection — Interested But Delaying", C,
    "Reply: 'I can tell this fits — and there's no rush from me. Let's just protect your position: I'll flag if the unit or price moves so you decide with full information, not under pressure.' Why it works: keeps momentum without pushing. Next action: agree a check-in date and watch the unit.",
    "objection, delay, interested, momentum, follow-up")
add("Objection — Likes Project But Hesitates", C,
    "Reply: 'You clearly like it — let's pin down the hesitation. Is it budget, payment plan, timing, or comparing with another option? Once I know the real concern, I can solve it properly instead of guessing.' Why it works: surfaces the true objection. Next action: address the specific concern, then next step.",
    "objection, hesitate, likes project, concern")
add("Objection — 'Is ROI Guaranteed?'", C,
    "Reply: 'I'd never guarantee ROI — anyone who does isn't being straight with you. What I can do is show historical performance for comparable assets and the demand drivers, so you make an informed decision. Returns depend on market conditions.' Why it works: compliant and credible. Next action: share general data with a verification note.",
    "objection, roi guaranteed, returns, compliance")
add("Objection — 'What Are The Risks?'", C,
    "Reply: 'Good question — every investment has risk. For off-plan it's developer delivery, market timing and liquidity; for ready it's price, service charges and resale demand. We reduce risk by choosing strong developers, prime locations and the right payment plan. Let me walk you through it for a specific option.' Why it works: honest, expert. Next action: risk review on a shortlisted unit.",
    "objection, risks, off-plan, ready, due diligence")

# ============ 6. OFF-PLAN SALES KNOWLEDGE ============
C = "Off-Plan Sales Knowledge"
add("Off-Plan — What Is Off-Plan Property", C,
    "Off-plan means buying directly from the developer before or during construction, usually on a staged payment plan, with handover at completion. It can offer entry pricing and flexible payments, but the right developer, location, unit and price matter more than simply buying early.",
    "off-plan, definition, developer, payment plan, handover")
add("Off-Plan — Benefits", C,
    "Potential benefits: lower entry price than completed stock, staged payment plans that ease cash flow, modern layouts and amenities, and a window for capital growth during construction in strong locations. None of these are guaranteed — they depend on selection and market conditions.",
    "off-plan, benefits, entry price, payment plan, growth")
add("Off-Plan — Risks", C,
    "Key risks: construction or handover delays, market movement before completion, and lower short-term liquidity. Mitigate by choosing reputable developers with escrow-protected projects, prime locations and sensible payment plans. Always set realistic expectations with the client.",
    "off-plan, risks, delays, liquidity, escrow")
add("Off-Plan — How To Evaluate", C,
    "Evaluate on: developer track record and delivery history, location and master-plan, unit type and layout, payment plan structure, price versus comparable launches, and expected demand at handover. Off-plan can be strong when selected properly — never imply every off-plan project is good.",
    "off-plan, evaluate, developer, location, payment plan, price")
add("Off-Plan — Can I Sell Before Handover?", C,
    "Often yes, via assignment/resale once a developer-set percentage is paid — rules and transfer fees vary by developer and project, subject to developer confirmation. It's a common exit, but confirm the specific project's resale terms before promising anything.",
    "off-plan, resale, assignment, exit, before handover")
add("Off-Plan — Is Off-Plan Safe?", C,
    "Dubai off-plan is regulated, with buyer payments typically held in escrow and released against construction milestones. That structure adds protection, but safety still comes from choosing the right developer, project and price. Use 'subject to' language and avoid blanket reassurances.",
    "off-plan, safe, escrow, regulation, rera")
add("Off-Plan — How Much Do I Need To Start?", C,
    "Entry usually starts with a booking/down payment (commonly around 10–20% of price, varies by developer and project), then staged instalments. Plus DLD and registration fees. Exact figures are project-specific and must be verified with the developer before confirming to a client.",
    "off-plan, down payment, booking amount, dld, costs")
add("Off-Plan — Extra Costs", C,
    "Beyond the unit price, budget for the DLD registration fee, Oqood/registration charges, any admin fees, and (where applicable) agency and service charges at handover. Always present the full cost picture so there are no surprises — verify current figures before quoting.",
    "off-plan, extra costs, dld, oqood, service charges, fees")

# ============ 7. READY PROPERTY KNOWLEDGE ============
C = "Ready Property Knowledge"
add("Ready Property — What Is Ready Property", C,
    "Ready property is a completed, handed-over unit you can use, rent or resell immediately. It suits buyers who want instant use or income. Always compare current market price, rental value, service charges, condition and resale demand before proceeding.",
    "ready property, completed, immediate, rental, resale")
add("Ready Property — For Rental Income", C,
    "For income, prioritise high-demand rental locations, healthy gross yields, manageable service charges and tenant-friendly layouts. Ready stock generates rent from day one. Discuss yields in general terms and verify current rental rates before quoting.",
    "ready property, rental income, yield, tenant demand")
add("Ready Property — For Personal Use", C,
    "For end-users, focus on community, layout, finishing, amenities, schools and commute rather than pure investment metrics. Ready lets them move in immediately and inspect the actual unit before buying.",
    "ready property, personal use, end user, lifestyle, community")
add("Ready Property — For Mortgage Buyers", C,
    "Ready property is generally more straightforward for mortgages than off-plan. Confirm down-payment requirements, eligibility and rates with a mortgage advisor or bank — these vary and must be verified. Position financing as a tool, not a guarantee.",
    "ready property, mortgage, finance, down payment, bank")
add("Ready Property — For Lower Construction Risk", C,
    "Buyers worried about delivery risk prefer ready: no construction or handover uncertainty, and what you see is what you get. The trade-off is usually a higher entry price than off-plan. Present both sides honestly.",
    "ready property, construction risk, delivery, completed")
add("Ready Property — And Golden Visa Planning", C,
    "Ready property at or above the AED 2M threshold can support a Golden Visa application, subject to current rules and authority approval. The advantage is an existing, valued asset. Never guarantee visa approval — final decision rests with the authority.",
    "ready property, golden visa, aed 2 million, residency")

# ============ 8. LUXURY PROPERTY KNOWLEDGE ============
C = "Luxury Property Knowledge"
add("Luxury — How To Evaluate Luxury Property", C,
    "For luxury, the strongest assets usually combine scarcity, prime views, top developer reputation, privacy and long-term resale appeal. Square-foot price matters less than uniqueness and demand for that specific address. Keep the conversation consultative and discreet.",
    "luxury, evaluate, scarcity, prime view, prestige")
add("Luxury — Buyer Priorities", C,
    "Luxury buyers prioritise privacy, exclusivity, finishing quality, branded-residence services, views and a trophy address. Price sensitivity is lower; fit, discretion and prestige are higher. Sell the lifestyle and rarity, not the discount.",
    "luxury, buyer priorities, privacy, branded, lifestyle")
add("Luxury — Scarcity Drives Value", C,
    "In luxury, limited supply protects value: waterfront plots, penthouses, signature villas and branded residences are inherently scarce. Position scarcity honestly — 'limited availability, subject to confirmation' — never manufacture false urgency.",
    "luxury, scarcity, waterfront, penthouse, value")
add("Luxury — Waterfront, Branded, Penthouse, Villa Positioning", C,
    "Waterfront and beachfront command premiums for views and lifestyle; branded residences add service and resale prestige; penthouses offer rarity and skyline views; signature villas offer privacy and land. Match the asset type to the buyer's priority and resale horizon.",
    "luxury, waterfront, branded residence, penthouse, villa")

# ============ 9. VILLA AND TOWNHOUSE KNOWLEDGE ============
C = "Villa and Townhouse Knowledge"
add("Villas — Demand in Dubai", C,
    "Family demand for villas in Dubai has remained strong, and quality villa inventory is more limited than apartment supply. Well-located villas in established communities can perform well for both lifestyle and resale. Confirm current pricing and availability before quoting.",
    "villa, demand, family, inventory, dubai")
add("Townhouses — Demand in Dubai", C,
    "Townhouses bridge apartments and villas — more space and privacy than a flat, at a lower entry than a standalone villa. They appeal strongly to growing families and first-time villa buyers in master-planned communities.",
    "townhouse, demand, family, master plan, value")
add("Villas — Family Buyer Logic", C,
    "Family buyers weigh schools, safety, community amenities, layout, garden/plot and commute over pure yield. Lead with lifestyle fit and long-term suitability; the investment case supports the decision but rarely drives it for end-users.",
    "villa, family buyer, schools, lifestyle, community")
add("Villas — Selection Criteria", C,
    "Assess plot size, built-up area, layout efficiency, privacy, view, community quality, school proximity and developer. A larger plot in a strong community usually protects resale value better than a bigger build on a weak plot.",
    "villa, selection, plot size, bua, layout, privacy")
add("Villas — Plot, BUA, Layout, Privacy, Schools", C,
    "Five villa value drivers: plot size (land you own), BUA (livable area), layout (flow and usability), privacy (corner/back-to-back), and school access (catchment demand). Strong scores here support both lifestyle and resale.",
    "villa, plot, bua, layout, privacy, schools")

# ============ 10. HOLIDAY HOME KNOWLEDGE ============
C = "Holiday Home Knowledge"
add("Holiday Homes — Investment Overview", C,
    "Not every property suits holiday-home (short-term rental) use. Before recommending it, check building/community rules, location demand, furnishing needs, expected occupancy, daily rate and management cost. Done right in the right building, it can outperform long-term rent — but it's not universal.",
    "holiday home, short term rental, investment, occupancy")
add("Holiday Homes — Short-Term Rental Suitability", C,
    "Best suited to tourist-heavy, high-footfall locations near beaches, Downtown, Marina and key attractions. Suitability depends on the specific building's permissions and demand patterns. Always verify the building allows short-term letting before advising the client.",
    "holiday home, short term, suitability, location, tourism")
add("Holiday Homes — Building Rules", C,
    "Some buildings and communities restrict or prohibit short-term letting, and a DTCM/holiday-home permit is typically required. Confirm the building's rules and permit eligibility before positioning a unit as a holiday home — subject to authority approval.",
    "holiday home, building rules, dtcm, permit, regulation")
add("Holiday Homes — Occupancy, Daily Rate, Management Cost", C,
    "The economics hinge on occupancy rate, achievable daily rate (seasonal), and operator/management fees (cleaning, listings, guest handling). Model conservatively and present net, not gross. Verify current rates with an operator before sharing projections.",
    "holiday home, occupancy, daily rate, management, net yield")

# ============ 11. DUBAI MARKET KNOWLEDGE ============
C = "Dubai Market Knowledge"
add("Dubai Market — Why Dubai", C,
    "Dubai offers no annual property tax, no capital gains tax and no personal income tax, strong rental demand, high safety, world-class infrastructure, global connectivity and residency options including the Golden Visa. It's a tax-efficient, lifestyle-rich market — but never guarantee future price growth.",
    "dubai market, why dubai, tax free, safety, golden visa")
add("Dubai Market — 2040 Urban Master Plan", C,
    "The Dubai 2040 Urban Master Plan guides long-term growth: more green space, expanded communities, transport and a higher quality of life for a growing population. It signals sustained investment and planning, which supports long-term demand — frame it as context, not a price promise.",
    "dubai market, 2040 master plan, growth, infrastructure")
add("Dubai Market — Rental Yields", C,
    "Dubai has historically offered attractive gross rental yields compared with many global cities, varying by area and property type. Quote yields in general terms and verify current rents for a specific unit before sharing numbers with a client.",
    "dubai market, rental yield, income, returns")
add("Dubai Market — Capital Appreciation", C,
    "Prime and master-planned areas have seen capital growth over time, but markets move in cycles and past performance is not a promise. Position appreciation as a possibility driven by location, demand and selection — never as a guarantee.",
    "dubai market, capital appreciation, growth, cycles")
add("Dubai Market — Tax Benefits", C,
    "Key tax advantages: no annual property tax, no capital gains tax on property, and no personal income tax. This materially improves net returns versus high-tax markets. (A one-time DLD transfer fee and standard fees still apply — verify current figures.)",
    "dubai market, tax benefits, no income tax, no capital gains")
add("Dubai Market — Dubai vs London / Europe", C,
    "Versus London or Europe, Dubai typically offers higher gross yields, no annual property or income tax, faster transactions and residency options; Europe offers market maturity and familiarity. For income and tax efficiency, Dubai is compelling. Offer a like-for-like comparison.",
    "dubai market, vs london, vs europe, comparison, yield")
add("Dubai Market — Safety and Stability", C,
    "Dubai is widely regarded as one of the safest cities globally, with strong governance and a stable, business-friendly environment. This underpins investor and end-user confidence. State it factually and avoid political commentary.",
    "dubai market, safety, stability, governance")
add("Dubai Market — Global City Status", C,
    "Dubai is a global hub for business, tourism, aviation and finance, with growing population and tourism, modern infrastructure and long-term residency options. These fundamentals support sustained property demand across cycles.",
    "dubai market, global city, tourism, business hub, connectivity")

# ============ 12. GOLDEN VISA KNOWLEDGE ============
C = "Golden Visa Knowledge"
add("Golden Visa — Overview", C,
    "The UAE Golden Visa is a long-term renewable residency. Property investment can help you qualify, generally with property ownership of AED 2 million or more, subject to current rules and authority approval. Always position it as a potential benefit, never a guaranteed outcome.",
    "golden visa, overview, residency, aed 2 million")
add("Golden Visa — Property Investor Route", C,
    "Buying qualifying property (generally AED 2M+) can support a property-investor Golden Visa application, subject to authority approval. We guide clients to suitable qualifying properties; final eligibility and approval always rest with the government authority.",
    "golden visa, property investor, qualify, threshold")
add("Golden Visa — AED 2 Million Threshold", C,
    "The commonly referenced property threshold is AED 2 million, applicable to ready and, in many cases, off-plan purchases, subject to current rules. Confirm the latest threshold and conditions with the authority before advising — rules can change.",
    "golden visa, aed 2 million, threshold, eligibility")
add("Golden Visa — Off-Plan and Golden Visa", C,
    "Off-plan purchases at or above the threshold can, in many cases, count toward the Golden Visa, subject to developer and authority confirmation and any minimum-payment conditions. Verify the specific project and current rules before promising eligibility.",
    "golden visa, off-plan, qualify, authority approval")
add("Golden Visa — Golden-Visa-Only Client", C,
    "If the client's main goal is the visa, recommend a clean qualifying asset that also makes investment sense (rentable, good location, resaleable). Don't let the visa goal push them into a weak property — the asset still has to stand on its own.",
    "golden visa, visa only client, qualifying asset, advice")
add("Golden Visa — Documents", C,
    "Typically required: passport copy, photo, proof of property ownership/title, and supporting financial documents — exact list varies and is confirmed by the authority or a processing agent. Share as a guide and tell the client the authority confirms final requirements.",
    "golden visa, documents, passport, title deed, checklist")
add("Golden Visa — Client Script", C,
    "'Property investment can help you qualify for the UAE Golden Visa if the value meets the required threshold, generally AED 2 million or more, subject to authority approval. I'll guide you to suitable properties, but final visa approval always comes from the government authority.'",
    "golden visa, client script, whatsapp, compliant")
add("Golden Visa — Do-Not-Say Rules", C,
    "Never say the visa is 'guaranteed', 'approved', 'automatic' or 'instant'. Never promise a timeline or override authority decisions. Always use 'subject to authority approval' and direct final eligibility to the official authority.",
    "golden visa, do not say, compliance, never guarantee")

# ============ 13. DEVELOPER KNOWLEDGE ============
C = "Developer Knowledge"
add("Developers — How To Compare Developers", C,
    "Compare on delivery track record, build and finishing quality, location of projects, payment-plan flexibility, after-sales/handover experience and resale demand. No developer is always best — evaluate project by project for the client's specific goal.",
    "developer, compare, track record, quality, project by project")
add("Developer — Emaar", C,
    "Emaar is a leading master-developer known for landmark communities (Downtown, Dubai Hills, Dubai Creek Harbour, Emaar South) and strong delivery and resale demand. Often suits investors and end-users wanting blue-chip locations. Still assess each specific project and unit.",
    "developer, emaar, downtown, dubai hills, blue chip")
add("Developer — Meraas", C,
    "Meraas is known for premium, design-led, lifestyle destinations (e.g. City Walk, Bluewaters, Jumeirah) with a boutique, high-quality positioning. Often suits buyers wanting distinctive, lifestyle-rich addresses. Evaluate project specifics and pricing.",
    "developer, meraas, city walk, bluewaters, lifestyle, premium")
add("Developer — Nakheel", C,
    "Nakheel is behind iconic waterfront and master communities (Palm Jumeirah, Palm Jebel Ali, and more), strong on waterfront and large-scale lifestyle. Often suits buyers seeking beach/waterfront and landmark addresses. Confirm project-level details.",
    "developer, nakheel, palm jumeirah, palm jebel ali, waterfront")
add("Developer — DAMAC", C,
    "DAMAC is a major private developer with a wide range from accessible to branded-luxury projects and frequent launches. Quality and location vary by project, so selection matters — assess each launch on its own merits for the client's goal.",
    "developer, damac, branded, luxury, launches")
add("Developer — Sobha", C,
    "Sobha is known for in-house construction and high build quality, with flagship communities like Sobha Hartland. Often suits quality-focused buyers. Verify project specifics, payment plan and pricing for the recommendation.",
    "developer, sobha, hartland, build quality")
add("Developer — Binghatti", C,
    "Binghatti is known for distinctive design and fast-moving launches, often at accessible entry points and increasingly in branded collaborations. Suits buyers wanting design-led, entry-to-mid pricing — assess location and delivery per project.",
    "developer, binghatti, design, branded, entry price")
add("Developer — Ellington", C,
    "Ellington is a design-focused boutique developer known for refined, contemporary residences and quality finishing. Often suits buyers prioritising design and end-user living. Evaluate each project's location and pricing.",
    "developer, ellington, boutique, design, quality")
add("Developer — Omniyat", C,
    "Omniyat is known for ultra-luxury, architecturally significant and branded developments (e.g. on the Dubai Water Canal and Palm). Suits high-net-worth buyers seeking trophy assets. Position on scarcity and prestige; confirm specifics.",
    "developer, omniyat, ultra luxury, branded, trophy")

# ============ 14. COMMUNITY KNOWLEDGE ============
C = "Community Knowledge"
add("Communities — How To Recommend Areas", C,
    "Recommend areas by fit, not favouritism: weigh budget, purpose, property type, timeline, lifestyle, school needs, Golden Visa goal, rental/resale aim and risk appetite. The right area for one client is wrong for another — always tie the suggestion to their stated goal.",
    "community, recommend areas, fit, budget, purpose")
add("Community — Dubai Hills Estate", C,
    "Dubai Hills Estate (Emaar) is a premium master community with villas, townhouses and apartments, a central park, golf and a major mall. Popular with families and investors for lifestyle and resale demand. Confirm current pricing and availability.",
    "community, dubai hills estate, emaar, family, villas, golf")
add("Community — Dubai Creek Harbour", C,
    "Dubai Creek Harbour (Emaar) is a waterfront master-plan with modern apartments, marina and creek views, near Downtown. Appeals to investors and end-users wanting new waterfront living with growth potential. Verify project specifics.",
    "community, dubai creek harbour, emaar, waterfront, apartments")
add("Community — Emaar South", C,
    "Emaar South is a master community near Al Maktoum Airport and Expo City, offering villas, townhouses and apartments at relatively accessible entry points. Suits value-focused and longer-horizon buyers. Confirm current pricing.",
    "community, emaar south, expo, value, villas, townhouses")
add("Community — Palm Jebel Ali", C,
    "Palm Jebel Ali (Nakheel) is a large new waterfront/island master-development positioned for premium beachfront living and long-term growth. Appeals to investors seeking next-generation waterfront. Details and availability subject to developer confirmation.",
    "community, palm jebel ali, nakheel, waterfront, beachfront")
add("Community — Business Bay", C,
    "Business Bay is a central, mixed-use district along the Water Canal with apartments, offices and hotels, near Downtown. Strong for rental demand and short-term-let potential (subject to building rules). Suits investors wanting central, liquid stock.",
    "community, business bay, central, apartments, rental, canal")
add("Community — Dubai Marina", C,
    "Dubai Marina is a mature, high-demand waterfront district with strong rental and short-term-let appeal (subject to building rules), lifestyle and walkability. A reliable income location for investors. Verify current rents and rules.",
    "community, dubai marina, waterfront, rental, lifestyle")
add("Community — JVC (Jumeirah Village Circle)", C,
    "JVC is a popular, value-oriented community with apartments, townhouses and villas, often offering attractive entry prices and yields. Suits first-time investors and value buyers. Confirm building quality and current pricing per project.",
    "community, jvc, jumeirah village circle, value, yield, apartments")
add("Community — Downtown Dubai", C,
    "Downtown Dubai (Emaar) is the iconic centre — Burj Khalifa, Dubai Mall, premium apartments — with strong global demand, prestige and short-term-let appeal (subject to rules). Suits prestige-seeking and income investors. Verify pricing and availability.",
    "community, downtown dubai, burj khalifa, prestige, apartments")

# ============ 15. FOLLOW-UP SCRIPTS ============
C = "Follow-Up Scripts"
add("Follow-Up — After Sending Brochure", C,
    "'Hi [Name], did you get a chance to look through the brochure I sent? Happy to walk you through the key points in 5 minutes and answer anything — what works for a quick call?'",
    "follow-up, after brochure, whatsapp, call")
add("Follow-Up — After Sending Price List", C,
    "'Hi [Name], following up on the pricing I shared. Prices and availability can move, so if any option stood out, let's lock the details before they change — shall I check current availability for you?'",
    "follow-up, after price list, availability, urgency")
add("Follow-Up — After Sending Multiple Options", C,
    "'Hi [Name], of the options I sent, which one felt closest to what you're after? Even a quick reaction helps me narrow it down and send you the single best fit.'",
    "follow-up, multiple options, shortlist, narrow")
add("Follow-Up — No Response (Follow-Up 1)", C,
    "'Hi [Name], just circling back on your Dubai property search. Still happy to help whenever the timing's right — anything you'd like me to send or clarify?'",
    "follow-up, no response, first, gentle")
add("Follow-Up — No Response (Follow-Up 2)", C,
    "'Hi [Name], I don't want to crowd your inbox — should I keep you updated on strong new launches that match your budget, or is now not the right time? Either answer is fine.'",
    "follow-up, no response, second, opt-in")
add("Follow-Up — No Response (Follow-Up 3)", C,
    "'Hi [Name], last note from me for now. I'll be here when you're ready, and I'll keep an eye out for anything that fits your goal. Wishing you well — just message anytime.'",
    "follow-up, no response, third, graceful")
add("Follow-Up — Interested But Delaying", C,
    "'Hi [Name], no rush at all — I just want to protect your position. If the unit or price you liked starts to move, I'll flag it so you decide with full information. Shall I keep watching it for you?'",
    "follow-up, delaying, interested, watch unit")
add("Follow-Up — Likes Project But Hesitates", C,
    "'Hi [Name], you liked [project] — is the hold-up budget, payment plan, timing, or comparing options? Tell me the real concern and I'll solve it properly so you can decide with confidence.'",
    "follow-up, hesitates, concern, project")

# ============ 16. MEETING AND SITE VISIT SCRIPTS ============
C = "Meeting and Site Visit Scripts"
add("Meeting — Client Ready For Meeting", C,
    "'Great — let's meet properly so I can tailor everything to you. Would you prefer our office, a Zoom call, or to view on site? I'll prepare a focused shortlist for your budget and goal either way.'",
    "meeting, ready, office, zoom, site visit")
add("Meeting — Office Meeting Invitation", C,
    "'Hi [Name], let's sit down at our Amber Homes office so I can show you options properly and answer everything in one go. What day and time suit you this week?'",
    "meeting, office, invitation, schedule")
add("Meeting — Zoom Meeting Invitation", C,
    "'Hi [Name], a quick Zoom is perfect if you're remote — I'll share my screen, walk you through shortlisted projects and pricing, and answer live. Does [suggest time] work? I'll send the link.'",
    "meeting, zoom, remote, invitation, overseas")
add("Site Visit — Invitation", C,
    "'Hi [Name], the best way to feel a project is to see it. I can arrange a site visit or show flat and a quick community tour so you experience the location first-hand. Which day works for you?'",
    "site visit, invitation, show flat, community tour")
add("Site Visit — Confirmation", C,
    "'Confirmed, [Name] — site visit on [day/time] at [location]. I'll meet you there and bring the unit details and pricing. If anything changes, just message me. Looking forward to it.'",
    "site visit, confirmation, schedule")
add("Site Visit — After Site Visit", C,
    "'Hi [Name], great to show you [project] today. What were your first impressions? If it felt right, the next step is to check current availability and secure your preferred unit before it moves — shall I do that?'",
    "site visit, after visit, next step, secure unit")

# ============ 17. EOI AND BOOKING PROCESS ============
C = "EOI and Booking Process"
add("EOI — Client Ready For EOI", C,
    "'Perfect — to register your interest and hold priority on your preferred unit, we submit an EOI (Expression of Interest) with a refundable/structured deposit, subject to developer terms. I'll guide you through it. Shall I start the EOI for your selected unit?'",
    "eoi, expression of interest, ready, priority, deposit")
add("EOI — Document Checklist", C,
    "Typically for an EOI: passport copy, full name as per passport, email, mobile number, nationality, preferred unit type and budget range, plus the EOI deposit per developer terms. Confirm the exact list for the specific developer before collecting.",
    "eoi, documents, passport, checklist, deposit")
add("Booking — Client Ready To Book", C,
    "'Excellent decision — to book, we complete the booking form and pay the booking amount to secure the unit, subject to availability and developer confirmation. I'll prepare everything and walk you through each step. Ready to proceed?'",
    "booking, ready to book, booking amount, secure unit")
add("Booking — Document Checklist", C,
    "Typically for booking: passport copy, full name as per passport, contact details, nationality, buyer type, proof of payment for the booking amount, and the signed booking form — subject to the developer's requirements. Verify the exact checklist per developer.",
    "booking, documents, passport, payment proof, checklist")
add("Booking — After Booking", C,
    "'Congratulations [Name]! Your unit is booked, subject to developer confirmation. Next, you'll receive the SPA and the payment schedule. I'll stay with you through every step — registration, payments and handover. Welcome to your Dubai investment.'",
    "booking, after booking, spa, payment schedule, next steps")
add("Booking — Next Steps After Booking", C,
    "After booking: SPA signing, DLD/Oqood registration, then payment-plan instalments through to handover. Keep the client informed at each milestone and set reminders for due payments. Confirm fees and dates with the developer/DLD.",
    "booking, next steps, spa, registration, payments, handover")

# ============ 18. CLOSING LANGUAGE ============
C = "Closing Language"
add("Closing — Smart Closing Language", C,
    "'I'd never push you into something that doesn't make sense. But if the project, price, unit and payment plan match your objective, the next step is simply to secure availability before it changes.' Calm, advisory, and respects the client — this is the Amber Homes close.",
    "closing, smart close, advisory, next step")
add("Closing — Soft Close", C,
    "'Based on everything you've told me, [unit] fits your goal well. How are you feeling about moving forward? If it's right, I'll handle the next step for you.' Low-pressure, invites the decision.",
    "closing, soft close, feeling, decision")
add("Closing — Availability Close", C,
    "'This unit/price is attracting interest and availability can change quickly, subject to confirmation. If it's the right fit, securing it now protects your position — shall I check live availability and hold it for you?' Use only when genuinely true.",
    "closing, availability close, urgency, secure")
add("Closing — Comparison Close", C,
    "'You've now seen the options side by side. For your goal, [unit] gives you the best balance of price, location and payment plan. Shall we move on that one?' Helps the client decide by clarifying the best fit.",
    "closing, comparison close, options, best fit")
add("Closing — Next-Step Close", C,
    "'Great — the next step is simple: I'll confirm current availability, share the booking details, and guide you through securing it. Shall I get that started for you now?' Turns agreement into action.",
    "closing, next step close, action, booking")

# ============ 19. COMPLIANCE AND DO-NOT-SAY RULES ============
C = "Compliance and Do-Not-Say Rules"
add("Compliance — Do Not Guarantee ROI", C,
    "Never guarantee ROI, rental returns or capital appreciation. Use general, historical or comparable framing with a verification note. Correct: 'returns depend on market conditions; here's how comparable assets have performed.' This protects the client and Amber Homes.",
    "compliance, do not say, roi, returns, guarantee")
add("Compliance — Do Not Guarantee Golden Visa", C,
    "Never guarantee Golden Visa eligibility, approval or timelines. Position property as potentially qualifying, generally AED 2M+, subject to authority approval, with final decision by the official authority.",
    "compliance, do not say, golden visa, approval")
add("Compliance — Do Not Guarantee Availability", C,
    "Never state a specific unit is definitely available. Use 'subject to availability' and offer to check live status before any commitment. Availability changes constantly and must be verified with the developer.",
    "compliance, do not say, availability, subject to")
add("Compliance — Do Not Guarantee Allocation", C,
    "Never promise a specific unit, floor, view or allocation before it is confirmed by the developer. Use 'subject to developer confirmation'. Manage expectations honestly to avoid disappointment and reputational risk.",
    "compliance, do not say, allocation, unit, developer confirmation")
add("Compliance — Do Not Guarantee Discounts", C,
    "Never promise discounts that don't exist. You may mention genuine, developer-confirmed incentives, framed as 'subject to developer confirmation'. Transparency on price and fees builds trust and protects credibility.",
    "compliance, do not say, discount, incentive")
add("Compliance — Use 'Subject To' Language", C,
    "Default to protective wording on anything unconfirmed: 'subject to availability', 'subject to developer confirmation', 'subject to authority approval', 'based on current market information'. It keeps every message compliant and credible.",
    "compliance, subject to, safe language, wording")
add("Compliance — Avoid Fake Promises", C,
    "Do not invent prices, payment plans, sizes, handover dates, fees, awards, rankings or 'sold out/available' status. If a fact isn't verified, say it needs verification. Honesty is the brand — never fabricate to win a reply.",
    "compliance, fake promises, never invent, honesty")
add("Compliance — Avoid Over-Selling", C,
    "Don't oversell or pressure. Calm, advisory confidence converts better in the premium segment than hype. Recommend by fit and let the client decide — pushiness erodes trust and resale relationships.",
    "compliance, over-selling, pressure, advisory")
add("Compliance — Protect Amber Homes Credibility", C,
    "Every message represents Amber Homes. Stay accurate, premium and compliant. When unsure, verify before confirming. Protecting credibility and the long-term client relationship always outweighs closing one deal faster.",
    "compliance, credibility, brand, trust, reputation")

# ============ 20. MASTER PROMPT / AI SYSTEM BEHAVIOUR ============
C = "Master Prompt / AI System Behavior"
add("System — Response Style (Short, Premium, Practical)", C,
    "Default outputs are short, premium, practical and sales-focused with a clear next step. For WhatsApp drafts, give ONLY the ready-to-send message unless the agent asks for explanation. For training, give concise bullets. For objections, give the recommended reply, why it works, and the next action.",
    "system, response style, short, premium, whatsapp draft")
add("System — Always Move To The Next Commercial Step", C,
    "Whatever the question, end by advancing the deal: a call, Zoom, office meeting, site visit, presentation, shortlist, EOI, booking, follow-up or close. Be calm and advisory — recommend the next step, never pressure it.",
    "system, next step, commercial, advisory, close")

# ---------------- emit SQL ----------------
def esc(s):
    return s.replace("'", "''")

rows = []
for (title, cat, content, tags) in E:
    rows.append("  ('{}','{}','{}','{}')".format(esc(title), esc(cat), esc(content), esc(tags)))

# sanity: unique titles
titles = [e[0] for e in E]
assert len(titles) == len(set(titles)), "DUPLICATE TITLES: " + str([t for t in titles if titles.count(t) > 1])

sql = """-- 17_knowledge_seed.sql
-- Amber Homes AI Knowledge Base — categorized, approved, agent-visible entries for Ask Amber.
-- SAFE & IDEMPOTENT: inserts only titles that do not already exist (re-running adds nothing new,
-- never duplicates, and never overwrites Master-Admin edits). Deletes/replaces nothing.
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- All entries: status=active, priority=1 (High), visibility=all (every mentor + agents can read),
-- source='Internal Amber Homes Knowledge', added_by = saad@amberhomes.ae (if that profile exists).
-- Total entries in this seed: {n}

insert into public.ai_knowledge (title, category, content, tags, status, priority, visibility, source, added_by)
select v.title, v.category, v.content, v.tags, 'active', 1, 'all', 'Internal Amber Homes Knowledge',
       (select id from public.profiles where lower(email) = 'saad@amberhomes.ae' limit 1)
from (values
{rows}
) as v(title, category, content, tags)
where not exists (select 1 from public.ai_knowledge k where k.title = v.title);

-- Verify after running:
-- select category, count(*) from public.ai_knowledge where source='Internal Amber Homes Knowledge' group by category order by category;
-- select count(*) from public.ai_knowledge;  -- should include the {n} seeded rows plus any pre-existing items
""".format(n=len(E), rows=",\n".join(rows))

open("supabase/17_knowledge_seed.sql", "w").write(sql)
print("Entries:", len(E))
from collections import Counter
cc = Counter(e[1] for e in E)
for c in cc:
    print(f"  {cc[c]:>3}  {c}")
print("Wrote supabase/17_knowledge_seed.sql")
