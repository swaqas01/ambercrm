// api/session-log.js — records the caller's device (IP, geolocation, device-id, user agent) for the
// admin Devices & Security panel, and — only when the 'device_limit_enabled' setting is on — enforces a
// maximum of 2 active devices per user by signing out the oldest. Auth-gated; writes via the service role
// because IP and geolocation are only visible to the server, not the browser.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_DEVICES  = 2;

const svc = { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY, "content-type": "application/json" };

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "";
  return String(xff).split(",")[0].trim() || null;
}
function geo(req) {
  const dec = (v) => { try { return v ? decodeURIComponent(String(v)) : null; } catch (e) { return v || null; } };
  return {
    city: dec(req.headers["x-vercel-ip-city"]),
    region: dec(req.headers["x-vercel-ip-country-region"]),
    country: dec(req.headers["x-vercel-ip-country"]),
  };
}
function labelFor(ua) {
  ua = String(ua || "");
  const os = /iphone|ipad|ipod/i.test(ua) ? "iPhone/iPad" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows"
    : /mac os x|macintosh/i.test(ua) ? "Mac" : /linux/i.test(ua) ? "Linux" : "Device";
  const br = /edg\//i.test(ua) ? "Edge" : /(chrome|crios)/i.test(ua) ? "Chrome" : /(firefox|fxios)/i.test(ua) ? "Firefox"
    : /safari/i.test(ua) ? "Safari" : "Browser";
  return os + " \u00b7 " + br;
}
async function capEnabled() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.device_limit_enabled&select=value`, { headers: svc });
    if (!r.ok) return false; // can't read settings -> don't enforce (avoid accidental sign-outs)
    const j = await r.json();
    return !(j && j[0] && String(j[0].value).toLowerCase() === "false"); // default ON unless explicitly disabled
  } catch (e) { return false; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SERVICE_KEY) return res.status(500).json({ error: "service role not set" });

  const authz = req.headers.authorization || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in." });
  let uid = null;
  try {
    const who = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: ANON_KEY, Authorization: "Bearer " + token } });
    if (!who.ok) return res.status(401).json({ error: "Invalid session." });
    const u = await who.json(); if (!u || !u.id) return res.status(401).json({ error: "Invalid session." });
    uid = u.id;
  } catch (e) { return res.status(401).json({ error: "Could not verify session." }); }

  try {
    const body = req.body || {};
    const deviceId = String(body.device_id || "").slice(0, 200);
    if (!deviceId) return res.status(400).json({ error: "device_id required" });
    const ua = String(body.user_agent || "").slice(0, 500);
    const g = geo(req);
    const row = { user_id: uid, device_id: deviceId, label: labelFor(ua), user_agent: ua, last_ip: clientIp(req),
      city: g.city, region: g.region, country: g.country, last_seen: new Date().toISOString() };
    // Upsert by (user_id, device_id). first_seen/revoked are omitted so they are not overwritten on update.
    await fetch(`${SUPABASE_URL}/rest/v1/user_devices?on_conflict=user_id,device_id`, {
      method: "POST", headers: { ...svc, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
    });

    // Active devices (informational count for the response).
    const ar = await fetch(`${SUPABASE_URL}/rest/v1/user_devices?user_id=eq.${uid}&revoked=eq.false&select=id&order=last_seen.desc`, { headers: svc });
    const active = ar.ok ? await ar.json() : [];

    // The automatic device cap is DISABLED for ALL users — a session must never be dropped just because
    // someone signed in on another device. Deliberate admin sign-out (the "Sign out" button in the Devices
    // panel) sets revoked_by and is still honored. A stale CAP revocation (revoked=true with NO revoked_by,
    // left over from when the cap was active) is healed here so it can't keep anyone signed out.
    const tr = await fetch(`${SUPABASE_URL}/rest/v1/user_devices?user_id=eq.${uid}&device_id=eq.${encodeURIComponent(deviceId)}&select=revoked,revoked_by`, { headers: svc });
    const trj = tr.ok ? await tr.json() : [];
    const rec = trj && trj[0];
    const manualRevoke = !!(rec && rec.revoked && rec.revoked_by);   // a real admin remote sign-out
    if (rec && rec.revoked && !rec.revoked_by) {                     // stale cap revocation -> clear it
      try { await fetch(`${SUPABASE_URL}/rest/v1/user_devices?user_id=eq.${uid}&device_id=eq.${encodeURIComponent(deviceId)}`, { method: "PATCH", headers: { ...svc, Prefer: "return=minimal" }, body: JSON.stringify({ revoked: false, revoked_at: null }) }); } catch (e) {}
    }
    return res.status(200).json({ ok: true, revoked: manualRevoke, active: active.length });
  } catch (e) {
    return res.status(500).json({ error: "session-log failed", detail: String((e && e.message) || e) });
  }
}
