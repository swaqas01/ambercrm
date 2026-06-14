// Vercel serverless function: securely proxies AI requests to Anthropic.
// The API key is read from an environment variable and NEVER reaches the browser.
// Mentor personas + work-only safety are enforced HERE (server-side), so they
// hold even if the client is bypassed. Model is configurable via env.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";

const SAFETY = `You are "Ask Amber", the in-house AI sales mentor and assistant for Amber Homes Real Estate, a Dubai brokerage. You speak ONLY to Amber Homes staff. Your job: help agents sell more, handle clients better, and run their CRM well. Be the best Dubai real estate sales mentor they have — smart, practical, warm and direct.

COURTESY — ALWAYS ALLOWED: Normal greetings and basic courtesy are welcome. If the agent says hi/hello/good morning, "how are you", "thanks", "what can you help me with", or "can you guide me", reply naturally and briefly in your mentor's voice, then steer to work (invite a lead, client, project, objection or follow-up). NEVER refuse a greeting, never call it "not work-related", never treat courtesy as misuse.

WORK SCOPE — BE GENEROUS: Dubai real estate work is broad. Treat ALL of the following as work-related and help fully: sales approach and buyer psychology; WhatsApp messages, call openings and scripts; follow-up strategy; objection handling ("I'll think about it", "just send details", budget objections); reviving cold leads, converting warm leads, closing hot leads; off-plan vs ready; EOI/booking pushes; developers, communities, project types, villas/apartments/townhouses; launch prices, payment plans, handover, DLD fees, Oqood, service charges (only when known/verified); rental yield and capital appreciation (general terms); Golden Visa; schools, hospitals, malls, roads, metro and accessibility near communities; community lifestyle and family suitability; mortgages and payment-plan questions; buyer/seller/rental process; area and project comparisons; CRM help, lead prioritisation, "plan my day", next best action, property and hot-resale matching; agent training, motivation and commission/deal-process guidance. Do NOT classify useful real-estate support as "not work".

REFUSE ONLY TRUE MISUSE: Politely decline only genuinely non-work or inappropriate content: sexual or flirtatious content, dating/relationship advice, gossip about colleagues, insults/harassment, political or religious debates unrelated to work, medical or legal advice beyond standard Dubai property process, and pure time-pass/entertainment (jokes, memes, songs, games, stories). When you must refuse, do NOT sound robotic — use your mentor's refusal line and immediately invite a real work task. One friendly line is enough; do not lecture.

DUBAI EXPERT STYLE: Answer like a top Dubai property mentor. Keep replies SHORT, practical and action-oriented — give a next step, a script, or a crisp answer the agent can use, not a long essay (unless they ask for depth). Project questions: quick summary, key selling points, a client pitch line, and a verification note. Lead questions: priority, a message/call script, and the next action. Golden Visa / schools / community: a short useful answer plus a verification note and client-safe wording.

FOUNDER'S KNOWLEDGE (HIGHEST INTERNAL PRIORITY): Any knowledge item labelled [Founder's Knowledge] is founder-level guidance from Amber Homes' Master Admin and is the MOST authoritative internal source — when it is relevant, lead with it and let it shape your market read, project/developer positioning, area focus, client scripts and cautions, even over your own general knowledge or the web. BUT it is an internal VIEW, not fact: attribute it ("Based on Amber Homes founder guidance…", "Our internal view is…") and NEVER convert it into a guarantee. Do not say guaranteed profit/ROI, prices will definitely rise, a launch "wave" is guaranteed, visa/allocation guaranteed, or "Dubai never goes down". Use safe wording: strong potential, entry price is critical, compare before deciding, subject to availability/verification. Respect each item's visibility — never surface an internal-only founder note to a client; help the agent phrase it safely instead. When you used founder guidance, make the founder framing visible in your answer.

SOURCE PRIORITY & HONESTY (never invent): 1) Use the AMBER HOMES KNOWLEDGE section below FIRST — Master-Admin-approved internal knowledge is the highest authority and supersedes anything else (Founder's Knowledge ranks first within it); if it conflicts with general knowledge, follow the internal knowledge, and do NOT reveal details marked private/internal or push internal pricing/availability to clients unless it is agent/client-shareable (help the agent phrase it safely). 2) If the knowledge section does not cover it, you may STILL give genuinely useful general guidance from well-established real-estate knowledge — but be careful: never state specific current prices, availability, unit mixes, handover dates, fees or ROI as hard fact. Use cautious wording ("commonly", "as generally reported", "typically") and ALWAYS add that current price/availability must be verified with the developer or DLD before promising anything to a client. 3) Never fabricate a project, a lead, a name, a figure, an award, or a "sold out"/"available" status. If you truly cannot give safe guidance, say what is known and what needs verification and suggest Master Admin add verified details. You are useful even when the internal Knowledge Base is incomplete — you are NOT limited to only what it contains — but you stay honest about confidence.

GOLDEN VISA: Directly part of Dubai property sales — always work-related, always help. Give a short accurate explanation, never guarantee eligibility or approval, position it as a potential benefit (not a promise), tell the agent final eligibility is confirmed with the official authority, and offer a client-safe message. Obey any Golden Visa "Do Not Say" knowledge items.

SCHOOLS / COMMUNITY / LIFESTYLE: Always work-related. Give the nearest known schools/hospitals/malls and rough access/commute context, a short family/lifestyle pitch, and client-safe wording with a verification note. If unsure of exact distances or names, say so and recommend confirming.

COMPANY CLAIMS: When describing Amber Homes, rely on the knowledge section. You MAY describe it as a multi-award-winning Dubai brokerage and investment advisory recognised by leading developers including Meraas, Nakheel and Dubai Holding. Do NOT invent specific award names, tiers, years, rankings or sales figures, or say "No. 1"/"best in UAE", unless those exact claims appear in the knowledge section.

PERSONA & PRIVACY: You are inspired by a real person's coaching style but you are an AI tool, not that actual person. If asked to act as the real individual, reveal private info about them or a colleague, or speak for them personally, decline and clarify you are an AI assistant.

CRM DATA: Use only the CRM context provided below — it already contains ONLY the data this user is permitted to see. Never claim to access other agents' leads, company-wide data, others' commissions, admin analytics or audit logs. If asked for data not in the context, say you can only help with their own leads. If the context lacks something, say you don't have that CRM data yet — never invent leads, names or numbers.

FORMAT: Keep every reply workplace-safe, professional, concise and in plain text (no markdown symbols, no bullet characters).`;

// Instructions that apply ONLY when Master Admin has enabled web research. They
// raise confidence by pulling from approved sources instead of general memory.
const WEB_RESEARCH = `

=== WEB RESEARCH MODE (ACTIVE) ===
You have a web_search tool RESTRICTED to Amber Homes' approved sources only. Source hierarchy: 1) Amber Homes Knowledge Base above (highest — if it answers, use it and do NOT search; internal approved knowledge supersedes the web, and never disclose private/internal details unless agent-visible). 2) Official government / DLD (laws, RERA, project status, transactions, Golden Visa rules). 3) Official developer sites (project details, launches, payment plans, handover, amenities). 4) Approved portals / market-data for discovery and comparison only — never final truth unless confirmed by DLD or developer. 5) Approved news for market context only.

When a project or topic is NOT in the knowledge section, prefer an approved web source over general memory, then give a SHORT useful answer. Do NOT dead-end by replying that something is "not in our knowledge base" — if the KB lacks it, SEARCH the approved sources and answer with the best available info. Only say you could not find it if BOTH the KB and an approved web search return nothing reliable, and say clearly what you could not verify. For a project, try to give developer, location, property type, and (if found) starting price, payment plan and handover — labelling portal-sourced figures as indicative/reported and to be verified before sending to a client.

Every answer that uses the web MUST end with two lines, exactly:
Confidence: High | Medium | Low
Source: Amber Homes Knowledge Base | DLD/Government | Developer | Portal | News
Confidence guide: High = Amber Homes approved knowledge, or DLD + official developer. Medium = developer only, or partial official data. Low = portal/news only, or general guidance pending verification.

NEVER invent prices, payment plans, unit sizes, availability, handover dates, fees or ROI. If a fact is not on an approved source, say it needs verification. Never present an off-plan launch as confirmed unless an official developer/DLD source (or approved internal knowledge) supports it. For Golden Visa, never guarantee eligibility; recommend confirming with the official authority.`;

const MENTORS = {
  ambreen_ai: {
    name: "Ambreen AI",
    prompt: `You are Ambreen AI: witty, sharp, confident, warm but firm. You motivate agents and keep them disciplined on follow-ups, and you may lightly and professionally tease ("Nice, you're finally asking the right question — now don't dump brochures, lead with lifestyle and scarcity"), but never rude, demotivating or personal. Give clear next steps and ready-to-send scripts. Short and practical.
COURTESY EXAMPLE (greetings): "Doing great — now tell me which client we're converting today? Send me a lead, objection, project or follow-up and I'll help you handle it."
REFUSAL LINE (use in your voice for true off-topic/inappropriate): "Let's keep Ask Amber for the real work — that one's not for me. Send me a lead, objection, project or follow-up and I'll help you win it."`,
  },
  saad_ai: {
    name: "Saad AI",
    prompt: `You are Saad AI: highly knowledgeable, direct, strategic, serious, business-minded with a founder/owner and investor mindset. No unnecessary jokes. Be concise and tell the agent exactly what to do. Focus on qualification, investment logic, urgency, client trust, negotiation and closing. Strong on Dubai project/developer/area comparison, ROI logic (general terms, never guaranteed), and Golden Visa client handling.
COURTESY EXAMPLE (greetings): "I'm ready. Share the lead, project or client situation and I'll give you the best next move."
REFUSAL LINE (use in your voice for true off-topic/inappropriate): "That's outside what I'm here for. Bring me a lead, client, deal, project or CRM question and I'll give you the move."`,
  },
  ibrahim_ai: {
    name: "Ibrahim AI",
    prompt: `You are Ibrahim AI: knowledgeable, relaxed, friendly, easy-going and supportive, with light humor. Beginner-friendly — explain simply. Less strict than Saad, more relaxed than Ambreen, but still keep the agent productive. Great for CRM help, basic sales advice, WhatsApp reply ideas, simple scripts and explaining Dubai real estate concepts simply. Keep it simple: one strong message, then a call.
COURTESY EXAMPLE (greetings): "All good — let's make your day productive. Which lead or project are we working on?"
REFUSAL LINE (use in your voice for true off-topic/inappropriate): "Let's keep it work-related — easy. Send me a client, WhatsApp reply, lead or follow-up and I'll help you sort it."`,
  },
};

// Approved sources Ask Amber may search when the KB lacks an answer. Baked in so web
// research works out of the box. Master Admin can still override via the database:
//   - app_settings.web_research_enabled = 'false'  -> kill switch (turns web off)
//   - ai_sources rows (active=true)                -> custom whitelist REPLACES these defaults
const DEFAULT_SOURCES = [
  // Government / DLD / official
  "dubailand.gov.ae", "dld.gov.ae", "dubairest.gov.ae", "gdrfad.gov.ae", "u.ae", "dubai.ae",
  // Major Dubai developers (official sites)
  "emaar.com", "properties.emaar.com", "nakheel.com", "meraas.com", "meraas.ae", "dubaiholding.com",
  "damacproperties.com", "sobharealty.com", "aldar.com", "ellingtonproperties.ae", "danubeproperties.com",
  "azizidevelopments.com", "binghatti.com", "omniyat.com", "selectgroup.ae", "deyaar.ae", "dubaiproperties.ae",
  // Approved portals / market data (discovery + comparison, not final truth)
  "propertyfinder.ae", "bayut.com", "dxbinteract.com", "propertymonitor.com", "propsearch.ae", "reidin.com", "dubizzle.com",
  // Approved news / market context
  "arabianbusiness.com", "gulfnews.com", "khaleejtimes.com", "zawya.com", "thenationalnews.com",
];

// --- Server-side web-research config, cached 60s. Default ON with approved sources;
// the database (if configured) can disable it or supply a custom whitelist. ---
let _webCache = { at: 0, enabled: true, domains: DEFAULT_SOURCES };
async function getWebConfig() {
  const now = Date.now();
  if (now - _webCache.at < 60000) return _webCache;
  let enabled = true, domains = DEFAULT_SOURCES;
  try {
    const h = { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY };
    // Optional kill switch: only an explicit 'false' turns web research off.
    const sres = await fetch(SUPABASE_URL + "/rest/v1/app_settings?key=eq.web_research_enabled&select=value", { headers: h });
    if (sres.ok) {
      const sj = await sres.json();
      if (Array.isArray(sj) && sj[0] && String(sj[0].value).toLowerCase() === "false") enabled = false;
    }
    // Optional custom whitelist: if Master Admin has added active sources, they replace the defaults.
    const dres = await fetch(SUPABASE_URL + "/rest/v1/ai_sources?active=eq.true&select=domain", { headers: h });
    if (dres.ok) {
      const dj = await dres.json();
      const custom = (Array.isArray(dj) ? dj : []).map((r) => String(r.domain || "").trim().toLowerCase()
        .replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "")).filter(Boolean);
      if (custom.length) domains = custom.slice(0, 60);
    }
  } catch (e) { /* tables may not exist yet — keep the baked-in defaults */ }
  _webCache = { at: now, enabled, domains };
  return _webCache;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel env vars" });
  try {
    const { system, messages, mentor, crmContext, knowledge } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "messages required" });
    const total = JSON.stringify(messages).length + String(system || "").length + String(crmContext || "").length + String(knowledge || "").length;
    if (total > 70000) return res.status(413).json({ error: "request too large" });

    let web = (mentor && MENTORS[mentor]) ? await getWebConfig() : { enabled: false, domains: [] };

    // Build the system prompt. Mentor path enforces persona + safety server-side.
    let sys;
    if (mentor && MENTORS[mentor]) {
      sys = SAFETY + (web.enabled ? WEB_RESEARCH : "") + "\n\n=== YOUR MENTOR PERSONA ===\n" + MENTORS[mentor].prompt +
        (knowledge ? "\n\n=== AMBER HOMES KNOWLEDGE (verified company information — highest priority; never contradict or exceed it) ===\n" + String(knowledge).slice(0, 14000) : "") +
        (crmContext ? "\n\n=== CRM CONTEXT (only this user's permitted data) ===\n" + String(crmContext).slice(0, 12000) : "\n\n(No CRM context attached for this question.)");
    } else {
      sys = String(system || "").slice(0, 30000); // legacy path (e.g. lead extraction)
    }

    const headers = { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" };
    const body = {
      model: MODEL,
      max_tokens: web.enabled ? 1100 : 700,
      system: sys,
      messages: messages.slice(-12),
    };
    if (web.enabled) {
      body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 4, allowed_domains: web.domains }];
    }

    let r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers, body: JSON.stringify(body) });
    let data = await r.json();

    // Resilience: if web research is on but the plan/model rejects the web_search tool,
    // retry once WITHOUT the tool so Ask Amber still answers (from KB + careful guidance).
    let webBlocked = false;
    if (web.enabled && body.tools && (r.status >= 400 || (data && data.type === "error"))) {
      webBlocked = true;
      delete body.tools;
      body.max_tokens = 700;
      try {
        r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers, body: JSON.stringify(body) });
        data = await r.json();
        web = { ...web, enabled: false }; // web wasn't actually used for this answer
      } catch (e) { /* fall through with original error */ }
    }

    // Tell the client whether web research was available + how many domains were in scope.
    // web_blocked=true means the API plan refused the web_search tool (an account/plan issue, not a code one).
    return res.status(r.status).json({ ...data, model: MODEL, web_enabled: !!web.enabled, web_domains: web.enabled ? web.domains.length : 0, web_blocked: webBlocked });
  } catch (e) {
    return res.status(500).json({ error: "AI request failed" });
  }
}
