// api/notify.js — Web Push sender. Fires a phone notification to an agent when a lead is assigned.
// Auth-gated: the caller must be a signed-in staff member. Uses the service role to read the target
// agent's push subscriptions (RLS hides other users' devices) and templates the message server-side
// from the lead, so a caller can only trigger the correct assignment notification — not arbitrary spam.
import webpush from "web-push";

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const ANON_KEY      = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:dev@amberhomes.ae";

const svcHeaders = { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "content-type": "application/json" };

async function getSubs(userId) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=endpoint,p256dh,auth`, { headers: svcHeaders });
  if (!r.ok) return [];
  return await r.json();
}
async function dropSub(endpoint) {
  try { await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE", headers: svcHeaders }); } catch (e) {}
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SERVICE_KEY) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" });
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return res.status(500).json({ error: "VAPID keys not set in Vercel env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)" });

  // Auth: caller must be a signed-in user.
  const authz = req.headers.authorization || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in." });
  let callerId = null;
  try {
    const who = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: ANON_KEY, Authorization: "Bearer " + token } });
    if (!who.ok) return res.status(401).json({ error: "Invalid session." });
    const u = await who.json();
    if (!u || !u.id) return res.status(401).json({ error: "Invalid session." });
    callerId = u.id;
  } catch (e) { return res.status(401).json({ error: "Could not verify session." }); }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    const body = req.body || {};
    let targetUserId = null, title = "", text = "", url = "/";

    if (body.summary) {
      // Bulk digest — only a non-agent (admin/ops/manager) can bulk-assign, so gate it to them.
      const pr = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerId}&select=role`, { headers: svcHeaders });
      const role = pr.ok ? (((await pr.json())[0]) || {}).role : null;
      if (!role || String(role) === "agent") return res.status(403).json({ error: "Not permitted." });
      targetUserId = body.agentId;
      const n = Math.max(1, parseInt(body.count, 10) || 1);
      title = n === 1 ? "New lead assigned to you" : (n + " new leads assigned to you");
      text = n === 1 ? "Open Amber to start working it." : "Open Amber to start working them.";
      url = "/";
    } else if (body.leadId) {
      // Single assignment — templated from the lead's real current assignee (can't be spoofed by the caller).
      const lr = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${body.leadId}&select=client_name,project,area,assigned_agent`, { headers: svcHeaders });
      const lead = lr.ok ? (((await lr.json())[0]) || null) : null;
      if (!lead || !lead.assigned_agent) return res.status(200).json({ sent: 0, reason: "no assignee" });
      targetUserId = lead.assigned_agent;
      title = "New lead assigned to you";
      text = (lead.client_name || "New lead") + (lead.project ? " — " + lead.project : (lead.area ? " — " + lead.area : ""));
      url = "/?lead=" + body.leadId;
    } else {
      return res.status(400).json({ error: "leadId or summary required" });
    }
    if (!targetUserId) return res.status(400).json({ error: "no target" });

    const subs = await getSubs(targetUserId);
    if (!subs.length) return res.status(200).json({ sent: 0, reason: "no devices" });

    const payload = JSON.stringify({ title, body: text, url, tag: body.leadId ? ("lead-" + body.leadId) : "leads-bulk", icon: "/icon-192-v4.png" });
    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (err) {
        const code = err && err.statusCode;
        if (code === 404 || code === 410) await dropSub(s.endpoint);   // stale subscription — clean up
      }
    }));
    return res.status(200).json({ sent });
  } catch (e) {
    return res.status(500).json({ error: "notify failed", detail: String((e && e.message) || e) });
  }
}
