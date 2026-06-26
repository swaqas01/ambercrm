import { createClient } from "@supabase/supabase-js";

// The publishable key is safe to ship in the app (protected by Row-Level Security).
const URL = import.meta.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";

export const supabase = createClient(URL, KEY, {
  // Keep users signed in across app restarts; the access token auto-refreshes from the long-lived
  // refresh token. (Session length is also governed by the Supabase dashboard session settings.)
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const ROLES = {
  master_admin: { label: "Master Admin", home: "admin" },
  admin:        { label: "Admin",         home: "admin" },
  sales_manager:{ label: "Sales Manager", home: "admin" },
  agent:        { label: "Agent",         home: "agent" },
  marketing:    { label: "Marketing",     home: "admin" },
  accounts:     { label: "Accounts",      home: "admin" },
  data_calling: { label: "Data Calling",  home: "calling" },
};
export function roleInfo(dbRole) { return ROLES[dbRole] || { label: "Agent", home: "agent" }; }

// The one and only Master Admin. This account is ALWAYS treated as master_admin in the
// app regardless of the role stored in the DB (a code-level safety net so a stale/incorrect
// profile row can never lock Saad out of admin, the AI Knowledge Base, or Ask Amber).
// Everyone else keeps exactly the role their profile says — no other account is elevated.
export const MASTER_ADMIN_EMAIL = "saad@amberhomes.ae";
export function resolveRole(email, dbRole) {
  return ((email || "").trim().toLowerCase() === MASTER_ADMIN_EMAIL) ? "master_admin" : dbRole;
}

// Which sidebar screens each role may open. 'users' is Master-Admin only.
const SCREEN_ACCESS = {
  master_admin: "ALL",
  admin:        ["projects","hotdeals","admin","lead","assign","performance","deals","dealdetail","devices","breakdown","myprofile","agents","agentprofile","targets","calling"],
  sales_manager:["projects","hotdeals","admin","live","open","lead","assign","pipeline","performance","matching","score","deals","dealdetail","breakdown","myprofile","calling"],
  agent:        ["projects","hotdeals","agent","live","open","lead","deals","dealdetail","breakdown","myprofile","calling"],
  marketing:    ["projects","admin","live","open","lead","settings","myprofile"],
  accounts:     ["projects","admin","commission","lead","settings","myprofile"],
  data_calling: ["calling","myprofile"],
};
export function allowedFor(role) { return SCREEN_ACCESS[role] || SCREEN_ACCESS.agent; }
export function canOpen(role, screen) { const a = allowedFor(role); return a === "ALL" || a.includes(screen); }

// Call after login to record last_login (best-effort).
export async function stampLogin(userId) {
  try { await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", userId); } catch (e) {}
}

// Helper for the frontend to call the secure admin backend.
export async function adminCall(action, payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/admin", { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session?.access_token || "") },
    body: JSON.stringify({ action, payload }) });
  return res.json();
}

// --- Reliable activity logging that survives mobile navigation to tel: -------------------------
// A normal supabase insert is sent with fetch and is CANCELLED when the page navigates to the
// phone dialer (tel:), so on mobile/PWA call clicks were being lost: an agent could tap Call many
// times and have almost none recorded. fetch(..., { keepalive: true }) tells the browser to finish
// the request even as the page unloads. RLS is unchanged — the row is still written as the
// signed-in user (actor_id must equal auth.uid()). We cache the access token so the call path is
// fully synchronous (no await) before the dialer opens.
let _amberToken = null;
try { supabase.auth.getSession().then(({ data }) => { _amberToken = (data && data.session && data.session.access_token) || null; }, () => {}); } catch (e) {}
try { supabase.auth.onAuthStateChange((_e, session) => { _amberToken = (session && session.access_token) || null; }); } catch (e) {}

export function logActivityReliable(action, lead, actorId, extra) {
  if (!actorId) return;
  const row = { lead_id: (lead && lead.id) || null, actor_id: actorId, action,
    detail: { client: lead && lead.client_name, lead_code: lead && lead.lead_code, ...(extra || {}) } };
  try {
    if (_amberToken) {
      fetch(URL + "/rest/v1/lead_activity", { method: "POST", keepalive: true,
        headers: { apikey: KEY, Authorization: "Bearer " + _amberToken, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(row) }).catch(() => {});
      return;
    }
  } catch (e) {}
  // Fallback only if the token is not cached yet (e.g. very first action after load).
  try { supabase.from("lead_activity").insert(row).then(() => {}, () => {}); } catch (e) {}
}

// Reliable "last contacted" stamp (also survives navigation). Mirrors markContacted's write.
export function stampContactedReliable(leadId, actorId) {
  if (!leadId || !actorId || !_amberToken) return;
  const nowIso = new Date().toISOString();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  try {
    fetch(URL + "/rest/v1/leads?id=eq." + leadId, { method: "PATCH", keepalive: true,
      headers: { apikey: KEY, Authorization: "Bearer " + _amberToken, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ last_contacted: today, last_contacted_at: nowIso, last_contacted_by: actorId }) }).catch(() => {});
  } catch (e) {}
}


// Reliable Data-Calling activity logging (same keepalive technique as logActivityReliable,
// so a logged Call/WhatsApp survives the page navigating to the tel:/wa.me dialer).
// RLS: row is written as the signed-in agent (agent_id must equal auth.uid()).
export function logDataCallReliable(recordId, action, actorId, extra) {
  if (!recordId || !actorId) return;
  const row = { data_calling_id: recordId, agent_id: actorId, action, ...(extra || {}) };
  try {
    if (_amberToken) {
      fetch(URL + "/rest/v1/data_calling_activity", { method: "POST", keepalive: true,
        headers: { apikey: KEY, Authorization: "Bearer " + _amberToken, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(row) }).catch(() => {});
      return;
    }
  } catch (e) {}
  try { supabase.from("data_calling_activity").insert(row).then(() => {}, () => {}); } catch (e) {}
}
