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
export async function logAi({ user, mentor, question, responseSum, model, status, flagCategory }) {
  try {
    if (!user) return;
    await supabase.from("ai_logs").insert({ user_id: user.id, user_name: user.name, user_role: user.role,
      mentor_id: mentor.id, mentor_name: mentor.name, question: String(question || "").slice(0, 1000),
      response_sum: String(responseSum || "").slice(0, 500), model: model || null, status: status || "success",
      flagged: !!flagCategory, flag_category: flagCategory || null });
    if (flagCategory) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await supabase.from("ai_logs").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("flagged", true).gte("created_at", since);
      if ((count || 0) >= 3) {
        await supabase.from("notifications").insert({ user_id: null, kind: "security",
          title: "Ask Amber: repeated non-work questions",
          body: `Ask Amber flagged repeated non-work-related questions from ${user.name}.`, link_screen: "admin" });
      }
    }
  } catch (e) {}
}
