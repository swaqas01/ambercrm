// Meta (Facebook / Instagram) Lead Ads -> Amber Homes CRM webhook.
//
//   GET  = one-time subscription verification handshake (Meta calls this when you save the
//          callback URL in the App dashboard). Echoes hub.challenge if the verify token matches.
//   POST = a "leadgen" notification. We take the leadgen_id, fetch the FULL lead from the Graph
//          API using OUR Page/System-User token (this is what authenticates the data — a forged
//          POST cannot supply a valid leadgen_id), map the fields, and insert a row into `leads`
//          via the service-role key. New leads land as status "New", temperature "Hot", UNASSIGNED
//          (they appear in Lead Assignment for a manager/admin to assign), tagged with the source.
//
// SAFE TO DEPLOY BEFORE THE DB MIGRATION: if the meta_* columns (migration 55) aren't there yet,
// the insert retries without them, so leads still flow in (idempotency just stays off until applied).
// No RLS/policy changes — the service-role insert runs server-side only, like api/admin.js.
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const APP_SECRET   = process.env.META_APP_SECRET;
const PAGE_TOKEN   = process.env.META_PAGE_ACCESS_TOKEN;
const GRAPH_VER    = process.env.META_GRAPH_VERSION || "v21.0";

// New Meta leads: high-intent inbound, surfaced for assignment. Tweak here if you prefer "Warm".
const NEW_TEMP = "Hot";

export const config = { api: { bodyParser: false } }; // we want the raw body for the signature check

function readRaw(req) {
  return new Promise((resolve) => {
    let data = "", done = false;
    const fin = () => { if (!done) { done = true; resolve(data); } };
    try {
      req.on("data", (c) => { data += c; });
      req.on("end", fin);
      req.on("error", fin);
      setTimeout(fin, 2500); // never hang if the runtime already consumed the stream
    } catch (e) { fin(); }
  });
}

function signatureOk(sig, raw) {
  if (!APP_SECRET || !sig || !raw) return false;
  try {
    const expected = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(raw, "utf8").digest("hex");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}

export default async function handler(req, res) {
  // 1) Verification handshake
  if (req.method === "GET") {
    const q = req.query || {};
    if (q["hub.mode"] === "subscribe" && VERIFY_TOKEN && q["hub.verify_token"] === VERIFY_TOKEN) {
      return res.status(200).send(q["hub.challenge"]);
    }
    return res.status(403).send("Forbidden");
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const raw = await readRaw(req);
  let body;
  try { body = raw ? JSON.parse(raw) : (req.body || {}); } catch (e) { body = req.body || {}; }

  // 2) Signature (defense-in-depth). If raw body is available and the signature is wrong, reject.
  //    If raw body isn't available on this runtime we can't compute it; we still proceed because the
  //    lead content itself is fetched from the Graph API by id, which an attacker cannot forge.
  const sig = req.headers["x-hub-signature-256"];
  if (APP_SECRET && raw && !signatureOk(sig, raw)) {
    console.warn("[meta-leads] bad signature — rejected");
    return res.status(403).json({ error: "Bad signature" });
  }
  if (APP_SECRET && !raw) console.warn("[meta-leads] raw body unavailable; relying on Graph fetch auth");

  if (!SERVICE_KEY || !PAGE_TOKEN) {
    console.error("[meta-leads] missing SUPABASE_SERVICE_ROLE_KEY or META_PAGE_ACCESS_TOKEN");
    return res.status(200).json({ ok: true }); // 200 so Meta doesn't retry-storm; logged for us
  }
  if (!body || body.object !== "page") return res.status(200).json({ ok: true });

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  let processed = 0;
  for (const entry of (body.entry || [])) {
    for (const ch of (entry.changes || [])) {
      if (ch.field !== "leadgen") continue;
      const leadgenId = ch.value && ch.value.leadgen_id;
      if (!leadgenId) continue;
      try { await processLead(svc, String(leadgenId)); processed++; }
      catch (e) { console.error("[meta-leads] process error", leadgenId, e && e.message); }
    }
  }
  // Always ack fast so Meta marks delivery successful (internal issues are logged, not surfaced).
  return res.status(200).json({ ok: true, processed });
}

async function processLead(svc, leadgenId) {
  // Idempotency: skip if we've already stored this Meta lead (no-ops cleanly before migration 55).
  const { data: existing } = await svc.from("leads").select("id").eq("meta_lead_id", leadgenId).limit(1);
  if (existing && existing.length) return;

  // Fetch the full lead from the Graph API (authenticates the data with our token).
  const fields = "id,created_time,field_data,ad_id,ad_name,form_id,campaign_name,platform";
  const url = `https://graph.facebook.com/${GRAPH_VER}/${encodeURIComponent(leadgenId)}?fields=${fields}&access_token=${encodeURIComponent(PAGE_TOKEN)}`;
  const resp = await fetch(url);
  const lead = await resp.json().catch(() => null);
  if (!resp.ok || !lead || lead.error) {
    console.error("[meta-leads] graph fetch failed", leadgenId, lead && lead.error && lead.error.message);
    return;
  }

  // Map the submitted answers.
  const answers = {};
  for (const fd of (lead.field_data || [])) {
    const key = (fd.name || "").toLowerCase();
    answers[key] = Array.isArray(fd.values) ? fd.values.join(", ") : (fd.values || "");
  }
  const pick = (...keys) => { for (const k of keys) if (answers[k]) return answers[k]; return null; };

  let name = pick("full_name", "name");
  if (!name && (answers["first_name"] || answers["last_name"]))
    name = `${answers["first_name"] || ""} ${answers["last_name"] || ""}`.trim();
  const phone = pick("phone_number", "phone", "mobile_number", "work_phone_number");
  const email = pick("email", "work_email");
  const clientName = String(name || email || "Facebook Lead").trim().slice(0, 120) || "Facebook Lead";

  const platform = String(lead.platform || "").toLowerCase();
  const sourceLabel = (platform.includes("ig") || platform.includes("insta")) ? "Instagram Lead Ad" : "Facebook Lead Ad";

  const known = new Set(["full_name","name","first_name","last_name","phone_number","phone","mobile_number","work_phone_number","email","work_email"]);
  const extras = Object.entries(answers).filter(([k]) => !known.has(k)).map(([k, v]) => `${k}: ${v}`);
  const notes = [
    `Meta ${sourceLabel}.`,
    lead.campaign_name ? `Campaign: ${lead.campaign_name}` : null,
    lead.ad_name ? `Ad: ${lead.ad_name}` : null,
    lead.form_id ? `Form: ${lead.form_id}` : null,
    lead.created_time ? `Submitted: ${lead.created_time}` : null,
    extras.length ? `\nAnswers:\n${extras.join("\n")}` : null,
  ].filter(Boolean).join("\n");

  const payload = {
    lead_code: "FB-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    client_name: clientName,
    phone: phone || null,
    whatsapp: phone || null,
    email: email || null,
    source: sourceLabel,
    campaign: lead.campaign_name || lead.ad_name || null,
    lead_type: "Buyer",
    status: "New",
    temperature: NEW_TEMP,
    notes,
    assigned_agent: null, current_owner: null, assigned_agent_name: null, created_by: null,
    meta_lead_id: leadgenId,
    meta_form_id: lead.form_id ? String(lead.form_id) : null,
    meta_created_time: lead.created_time || null,
  };

  let { data: ins, error } = await svc.from("leads").insert(payload).select("id").single();
  // Graceful degradation if optional columns aren't present yet (e.g. migration 55 not run).
  if (error) {
    const msg = (error.message || "") + " " + (error.details || "");
    if (/meta_lead_id|meta_form_id|meta_created_time|lead_type|campaign|assigned_agent_name/i.test(msg) && /(column|schema|exist)/i.test(msg)) {
      const rest = { ...payload };
      ["meta_lead_id","meta_form_id","meta_created_time","lead_type","campaign","assigned_agent_name"].forEach((k) => delete rest[k]);
      ({ data: ins, error } = await svc.from("leads").insert(rest).select("id").single());
    }
  }
  if (error) {
    if (error.code === "23505") return; // unique meta_lead_id -> already processed
    console.error("[meta-leads] insert failed", leadgenId, error.message);
    return;
  }

  // Best-effort timeline entry + broadcast notification to admins (never blocks the webhook).
  try { if (ins && ins.id) await svc.from("lead_activity").insert({ lead_id: ins.id, actor_id: null, action: "created", detail: { source: sourceLabel, via: "meta_webhook" } }); } catch (e) {}
  try { await svc.from("notifications").insert({ user_id: null, kind: "system", title: "New " + sourceLabel, body: clientName + (phone ? " — " + phone : ""), link_screen: "assign" }); } catch (e) {}
}
