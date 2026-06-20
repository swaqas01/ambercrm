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

// Email (Resend) — same provider already used for sign-in codes.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM    = process.env.RESEND_FROM || "Amber Homes CRM <onboarding@resend.dev>";
const APP_URL        = (process.env.APP_URL || "https://crm.amberhomes.ai").replace(/\/+$/, "");
// WhatsApp (Meta Cloud API) — business-initiated messages require an APPROVED template with one body variable {{1}}.
const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WA_TEMPLATE = process.env.WHATSAPP_TEMPLATE;
const WA_LANG     = process.env.WHATSAPP_TEMPLATE_LANG || "en";
const WA_VER      = process.env.WHATSAPP_API_VERSION || "v21.0";

async function getAgentContact(userId) {
  let prof = null, ext = null;
  try { const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=full_name,email,whatsapp,phone`, { headers: svcHeaders }); if (r.ok) prof = (await r.json())[0] || null; } catch (e) {}
  try { const r = await fetch(`${SUPABASE_URL}/rest/v1/agent_profiles?user_id=eq.${userId}&select=whatsapp,phone`, { headers: svcHeaders }); if (r.ok) ext = (await r.json())[0] || null; } catch (e) {}
  if (!prof && !ext) return null;
  return {
    full_name: prof && prof.full_name,
    email: prof && prof.email,
    whatsapp: (ext && ext.whatsapp) || (prof && prof.whatsapp) || null,   // My Profile saves to agent_profiles
    phone: (ext && ext.phone) || (prof && prof.phone) || null,
  };
}
async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY || !to) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST",
      headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }) });
    return r.ok;
  } catch (e) { return false; }
}
function waNumber(raw) {
  let d = String(raw || "").replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  return d.length >= 8 ? d : null;   // expect full international format, e.g. 9715XXXXXXXX
}
async function sendWhatsApp(toRaw, varText) {
  if (!WA_TOKEN || !WA_PHONE_ID || !WA_TEMPLATE) return { sent: false, reason: "not_configured" };
  const to = waNumber(toRaw);
  if (!to) return { sent: false, reason: "no_number" };
  try {
    const r = await fetch(`https://graph.facebook.com/${WA_VER}/${WA_PHONE_ID}/messages`, { method: "POST",
      headers: { Authorization: "Bearer " + WA_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template",
        template: { name: WA_TEMPLATE, language: { code: WA_LANG },
          components: [{ type: "body", parameters: [{ type: "text", text: String(varText || "a new lead").slice(0, 250) }] }] } }) });
    if (r.ok) return { sent: true };
    let detail = ""; try { detail = JSON.stringify(await r.json()).slice(0, 300); } catch (e) {}
    return { sent: false, reason: "api_error", detail };
  } catch (e) { return { sent: false, reason: String((e && e.message) || e) }; }
}
function assignEmailHtml(name, bodyLine, link) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;padding:8px">
    <h2 style="color:#0e1828;margin:0 0 10px">Amber Homes CRM</h2>
    <p style="color:#333;margin:0 0 6px">Hi ${name || "there"},</p>
    <p style="color:#333;margin:0 0 14px">${bodyLine}</p>
    <a href="${link}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:9px">Open in Ask Amber</a>
    <p style="color:#888;font-size:12.5px;margin:16px 0 0">You're receiving this because a lead was assigned to you in the Amber Homes CRM.</p>
  </div>`;
}

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
  const pushReady = !!(VAPID_PUBLIC && VAPID_PRIVATE);   // push is optional; email/WhatsApp still send without it

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
    if (pushReady) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
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

    // ---- Channel 1: Web Push (existing) — only if VAPID is configured and the agent has registered devices.
    let pushSent = 0;
    if (pushReady) {
      const subs = await getSubs(targetUserId);
      const payload = JSON.stringify({ title, body: text, url, tag: body.leadId ? ("lead-" + body.leadId) : "leads-bulk", icon: "/icon-192-v4.png" });
      await Promise.all(subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
          pushSent++;
        } catch (err) {
          const code = err && err.statusCode;
          if (code === 404 || code === 410) await dropSub(s.endpoint);   // stale subscription — clean up
        }
      }));
    }

    // The agent's contact details for the email + WhatsApp channels.
    const agent = await getAgentContact(targetUserId);
    const firstName = agent && agent.full_name ? String(agent.full_name).split(" ")[0] : "";
    const link = APP_URL + (url || "/");

    // ---- Channel 2: Email (Resend) — fires whenever RESEND_API_KEY is set.
    let emailSent = false;
    if (agent && agent.email) {
      const bodyLine = body.leadId
        ? ("A new lead has been assigned to you: <b>" + (text || "New lead") + "</b>.")
        : ("<b>" + title + "</b> — open Ask Amber to start working them.");
      emailSent = await sendEmail(agent.email, title, assignEmailHtml(firstName, bodyLine, link));
    }

    // ---- Channel 3: WhatsApp (Meta Cloud API) — fires only when the WHATSAPP_* env vars are configured.
    const waVar = body.leadId ? (text || "a new lead") : title;
    const wa = await sendWhatsApp(agent ? (agent.whatsapp || agent.phone) : null, waVar);

    return res.status(200).json({ push: pushSent, email: emailSent, whatsapp: wa.sent, wa_reason: wa.reason || null });
  } catch (e) {
    return res.status(500).json({ error: "notify failed", detail: String((e && e.message) || e) });
  }
}
