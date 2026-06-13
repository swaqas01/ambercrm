import { supabase } from "./supabase.js";

// Display metadata only. The authoritative personas + safety live server-side in /api/ai.
export const MENTORS = [
  { id: "ambreen_ai", name: "Ambreen AI", avatar: "/mentors/ambreen.png", accent: "#7C5CFA",
    desc: "Witty, sharp and motivating. Keeps you disciplined on follow-ups and client handling.",
    greeting: "Hi, I'm Ambreen AI. Ask me anything work-related — but after this, I expect your follow-ups done." },
  { id: "saad_ai", name: "Saad AI", avatar: "/mentors/saad.png", accent: "#C49A4A",
    desc: "Direct and strategic. Investment logic, qualification, negotiation and closing.",
    greeting: "Hi, I'm Saad AI. Ask me your sales, investment, lead or client question. I'll keep it direct." },
  { id: "ibrahim_ai", name: "Ibrahim AI", avatar: "/mentors/ibrahim.png", accent: "#2E9E83",
    desc: "Relaxed and friendly. Great for CRM help, scripts and explaining things simply.",
    greeting: "Hey, I'm Ibrahim AI. Ask me anything work-related — I'll keep it simple and useful." },
];
export const mentorById = (id) => MENTORS.find((m) => m.id === id) || MENTORS[0];

// Lightweight client-side guard for clearly non-work content (the server enforces too).
const BAD = [
  /\b(sex|sexual|nude|naked|horny|hookup|hook up|dick|boobs|porn)\b/i,
  /\b(date|dating|girlfriend|boyfriend|crush|romance|romantic|flirt|love you|marry me)\b/i,
  /\b(gossip|rumou?r|who is dating|secretly|behind (his|her|their) back)\b/i,
  /\b(idiot|stupid|shut up|f[\*u]ck|bitch|bastard|asshole)\b/i,
  /\b(joke|meme|bored|time ?pass|timepass|entertain me|sing|poem|story)\b/i,
];
export function classifyInappropriate(text) {
  const t = String(text || "");
  if (BAD[0].test(t)) return "sexual";
  if (BAD[1].test(t)) return "personal";
  if (BAD[2].test(t)) return "gossip";
  if (BAD[3].test(t)) return "abusive";
  if (BAD[4].test(t)) return "non_work";
  return null;
}

// Build CRM context from ONLY the data this user may see (row-level security enforces the limit).
export async function buildCrmContext(user, lead) {
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
    const { data: { user: au } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("leads")
      .select("client_name, area, project, status, temperature, budget, next_followup, last_contacted, purpose, ready_offplan, assigned_agent, current_owner, created_by, is_open")
      .limit(800);
    if (error) return null;
    let rows = data || [];
    const isAgent = user && user.role === "agent";
    if (isAgent && au) rows = rows.filter((l) => l.assigned_agent === au.id || l.current_owner === au.id || l.created_by === au.id);
    const active = rows.filter((l) => l.status !== "Closed Won" && l.status !== "Closed Lost");
    const summary = {
      scope: isAgent ? "this agent's own leads only" : (user && user.roleLabel) + " — permitted leads",
      total: rows.length,
      hot: rows.filter((l) => l.temperature === "Hot" || l.temperature === "Very Hot").length,
      dueToday: active.filter((l) => l.next_followup && l.next_followup <= today).length,
      overdue: active.filter((l) => l.next_followup && l.next_followup < today).length,
      closedWon: rows.filter((l) => l.status === "Closed Won").length,
    };
    const list = rows.slice(0, 40).map((l) => ({ name: l.client_name, area: l.area, project: l.project,
      status: l.is_open ? "Open" : l.status, temp: l.temperature, budget: l.budget, next: l.next_followup, purpose: l.purpose }));
    let ctx = "Today: " + today + "\nSummary: " + JSON.stringify(summary) + "\nLeads:\n" + JSON.stringify(list);
    if (lead) ctx += "\n\nThe agent is currently viewing this specific lead (use this context for 'this client' questions):\n" +
      JSON.stringify({ name: lead.client_name, area: lead.area, project: lead.project, status: lead.status,
        temp: lead.temperature, budget: lead.budget, purpose: lead.purpose, ready_offplan: lead.ready_offplan,
        timeline: lead.timeline, next: lead.next_followup });
    return ctx;
  } catch (e) { return null; }
}

// Log every Ask Amber turn; flag + (on repeat) notify Master Admin.
// Lightweight category tag for work questions (for Master Admin's Ask Amber Logs).
export function categorize(text) {
  const t = String(text || "").toLowerCase();
  if (/whatsapp|message|draft|reply|template|script|write/.test(t)) return "drafting";
  if (/plan my day|follow ?up|call back|remind|chase|overdue|due today/.test(t)) return "follow_up";
  if (/project|palm|jebel|brochure|payment plan|floor ?plan|handover|launch|sold out/.test(t)) return "project";
  if (/close|deal|negotiat|offer|objection|convert|qualif|closing/.test(t)) return "sales";
  if (/dubai|developer|emaar|nakheel|meraas|dubai holding|area|community|golden visa|market|roi|mortgage/.test(t)) return "dubai_re";
  if (/lead|client|pipeline|\bcrm\b|status|assign|hot lead|cold lead|temperature/.test(t)) return "crm";
  return "other";
}

export async function logAi({ user, mentor, question, responseSum, fullResponse, model, status, flagCategory, category, deniedReason, tokensIn, tokensOut }) {
  try {
    if (!user) return;
    const inappropriate = !!flagCategory && ["sexual", "personal", "gossip", "abusive"].includes(flagCategory);
    const nonwork = flagCategory === "non_work";
    const cat = flagCategory ? (flagCategory === "non_work" ? "non_work" : (["sexual", "personal"].includes(flagCategory) ? flagCategory : "inappropriate")) : (category || null);
    let device = null; try { device = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent.slice(0, 240) : null; } catch (e) {}
    await supabase.from("ai_logs").insert({ user_id: user.id, user_name: user.name, user_email: user.email || null, user_role: user.role,
      mentor_id: mentor.id, mentor_name: mentor.name, question: String(question || "").slice(0, 2000),
      response_sum: String(responseSum || "").slice(0, 500), full_response: fullResponse ? String(fullResponse).slice(0, 8000) : null,
      model: model || null, status: status || "success", flagged: !!flagCategory, flag_category: flagCategory || null,
      category: cat, inappropriate, non_work: nonwork, refusal_reason: status === "refused" ? (flagCategory || "non-work") : null,
      denied_reason: deniedReason || null, device, tokens_in: tokensIn || null, tokens_out: tokensOut || null });
    if (flagCategory) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await supabase.from("ai_logs").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("flagged", true).gte("created_at", since);
      if ((count || 0) >= 3) {
        await supabase.from("notifications").insert({ user_id: null, kind: "security",
          title: "Ask Amber: repeated non-work questions",
          body: `Ask Amber flagged repeated non-work-related questions from ${user.name}.`, link_screen: "ailogs" });
      }
    }
  } catch (e) {}
}

/* ============================ AI KNOWLEDGE BASE ============================ */
// Mentor id -> the visibility values that mentor is allowed to read.
const MENTOR_VIS = {
  ambreen_ai: ["all", "agent_ok", "ambreen_ai"],
  saad_ai:    ["all", "agent_ok", "saad_ai"],
  ibrahim_ai: ["all", "agent_ok", "ibrahim_ai"],
};

// Load active knowledge items this user is permitted to read (RLS also enforces this
// server-side). Called once per Ask Amber session and cached by the caller.
export async function fetchKnowledge(user) {
  try {
    const isAdmin = user && (user.role === "master_admin" || user.role === "admin" || user.role === "sales_manager");
    let q = supabase.from("ai_knowledge")
      .select("id,title,category,content,visibility,priority,status,deleted")
      .eq("status", "active").eq("deleted", false)
      .order("priority", { ascending: true });
    const { data, error } = await q;
    let items = (!error && Array.isArray(data)) ? data.filter((k) => k.visibility !== "admin_only" || isAdmin) : [];
    // Fold APPROVED PROJECTS into the knowledge pool as 'Project Knowledge' items so
    // Ask Amber can answer "tell me about <project>". RLS already limits agent visibility.
    try {
      const { data: projs } = await supabase.from("projects")
        .select("id,name,developer,area,property_type,starting_price,payment_plan,handover_date,unit_types,bedroom_options,selling_points,investment_points,risks_notes,golden_visa,target_client,talking_points,do_not_say,status,agent_visible,deleted")
        .eq("deleted", false).neq("status", "inactive");
      (projs || []).forEach((p) => {
        if (!isAdmin && !p.agent_visible) return;
        const parts = [];
        const add = (lbl, v) => { if (v) parts.push(lbl + ": " + v); };
        add("Developer", p.developer); add("Area", p.area); add("Type", p.property_type);
        add("Status", p.status === "sold_out" ? "Sold out" : p.status === "upcoming" ? "Upcoming" : "Active");
        add("Starting price", p.starting_price); add("Payment plan", p.payment_plan); add("Handover", p.handover_date);
        add("Unit types", p.unit_types || p.bedroom_options); add("Selling points", p.selling_points);
        add("Investment points", p.investment_points); add("Golden Visa", p.golden_visa);
        add("Target client", p.target_client); add("Risks/notes", p.risks_notes); add("Approved talking points", p.talking_points);
        if (p.do_not_say) parts.push("DO NOT SAY for this project: " + p.do_not_say);
        items.push({ id: "proj_" + p.id, title: p.name, category: "Project Knowledge", visibility: "all", priority: 2,
          content: "Approved project details for " + p.name + ". " + parts.join(". ") });
      });
    } catch (e) {}
    return items;
  } catch (e) { return []; }
}

const STOP = new Set("the a an and or of to for in on with your you our we is are be as at by it this that how do does what when which who whom about into from".split(" "));
function tokens(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}

// Pick the most relevant knowledge items for a question using keyword/category
// overlap (MVP retrieval — no embeddings yet). Compliance items are ALWAYS included
// so the AI never loses the "Do Not Say" guardrails. Returns { text, used:[{id,title}] }.
export function pickKnowledge(question, items, mentorId, max = 6) {
  if (!Array.isArray(items) || !items.length) return { text: "", used: [] };
  const vis = MENTOR_VIS[mentorId] || ["all", "agent_ok"];
  const pool = items.filter((k) => vis.includes(k.visibility));
  const qTok = new Set(tokens(question));
  const scored = pool.map((k) => {
    const hay = tokens(k.title + " " + k.category + " " + k.content);
    let score = 0;
    for (const w of hay) if (qTok.has(w)) score += 1;
    // Title hits weigh more; high priority gets a small boost.
    for (const w of tokens(k.title)) if (qTok.has(w)) score += 2;
    score += (4 - (k.priority || 2)) * 0.5;
    const compliance = /do not say|compliance/i.test(k.category);
    return { k, score, compliance };
  });
  // Always-include compliance items, then top-scoring others.
  const compliance = scored.filter((s) => s.compliance).map((s) => s.k);
  const others = scored.filter((s) => s.compliance === false && s.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, max).map((s) => s.k);
  // If nothing matched, fall back to the highest-priority general items so company
  // questions ("introduce Amber Homes") still get the core profile.
  let chosen = [...compliance, ...others];
  if (others.length === 0) {
    const core = pool.filter((k) => !/do not say|compliance/i.test(k.category))
      .sort((a, b) => (a.priority || 2) - (b.priority || 2)).slice(0, 3);
    chosen = [...compliance, ...core];
  }
  // De-dupe, cap total.
  const seen = new Set(); const final = [];
  for (const k of chosen) { if (!seen.has(k.id)) { seen.add(k.id); final.push(k); } if (final.length >= max + 2) break; }
  const text = final.map((k) => `[${k.category}] ${k.title}\n${k.content}`).join("\n\n");
  return { text, used: final.map((k) => ({ id: k.id, title: k.title })) };
}
