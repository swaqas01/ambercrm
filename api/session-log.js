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
    if (!r.ok) return false;
    const j = await r.json();
    return !!(j && j[0] && String(j[0].value).toLowerCase() === "true");
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

    // Active devices for this user, newest first.
    const ar = await fetch(`${SUPABASE_URL}/rest/v1/user_devices?user_id=eq.${uid}&revoked=eq.false&select=id,device_id,last_seen&order=last_seen.desc`, { headers: svc });
    const active = ar.ok ? await ar.json() : [];
    // Cap: keep the 2 most-recently-seen, sign out the rest. The current device just refreshed last_seen,
    // so it is newest and is never the one signed out. Only runs when the setting is enabled.
    if (active.length > MAX_DEVICES && await capEnabled()) {
      for (const d of active.slice(MAX_DEVICES)) {
        try { await fetch(`${SUPABASE_URL}/rest/v1/user_devices?id=eq.${d.id}`, { method: "PATCH", headers: { ...svc, Prefer: "return=minimal" }, body: JSON.stringify({ revoked: true, revoked_at: new Date().toISOString() }) }); } catch (e) {}
      }
    }

    // Is THIS device revoked (e.g. an admin signed it out remotely, or the cap removed it)?
    const tr = await fetch(`${SUPABASE_URL}/rest/v1/user_devices?user_id=eq.${uid}&device_id=eq.${encodeURIComponent(deviceId)}&select=revoked`, { headers: svc });
    const trj = tr.ok ? await tr.json() : [];
    const revoked = !!(trj && trj[0] && trj[0].revoked);
    return res.status(200).json({ ok: true, revoked, active: active.length });
  } catch (e) {
    return res.status(500).json({ error: "session-log failed", detail: String((e && e.message) || e) });
  }
}
