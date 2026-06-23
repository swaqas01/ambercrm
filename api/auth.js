// Server-side auth for Amber Lead Desk.
// Holds the SERVICE ROLE key (server-only). Verifies passwords WITHOUT handing a
// session to the browser, issues/verifies a one-time email 2FA code, and only then
// mints a session (via a magic-link token hash the client redeems). Also clears the
// password-change flags server-side (agents can't write their own profile under RLS).
// Never import this from the browser.
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;        // set this in Vercel to switch ON mandatory email 2FA
const RESEND_FROM    = process.env.RESEND_FROM || "Amber Homes CRM <onboarding@resend.dev>";
const OTP_PEPPER     = process.env.OTP_PEPPER || "amber-otp-pepper-v1";

const svcClient  = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const anonClient = () => createClient(SUPABASE_URL, ANON_KEY,    { auth: { autoRefreshToken: false, persistSession: false } });
const gen4 = () => String(Math.floor(1000 + Math.random() * 9000));
const hashCode = (code, email) => crypto.createHash("sha256").update(String(code) + "|" + email.toLowerCase() + "|" + OTP_PEPPER).digest("hex");
const sha256pep = (s) => crypto.createHash("sha256").update(String(s) + "|" + OTP_PEPPER).digest("hex");
const genTrustToken = () => crypto.randomBytes(32).toString("hex");
const TRUST_DAYS = 7, MAX_TRUSTED_DEVICES = 2;
function uaParts(ua) {
  ua = String(ua || "");
  const os = /iphone|ipad|ipod/i.test(ua) ? "iPhone/iPad" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows" : /mac os x|macintosh/i.test(ua) ? "Mac" : /linux/i.test(ua) ? "Linux" : "Device";
  const br = /edg\//i.test(ua) ? "Edge" : /(chrome|crios)/i.test(ua) ? "Chrome" : /(firefox|fxios)/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Browser";
  return { os, browser: br, label: os + " \u00b7 " + br };
}

const TRUST_COOKIE = "amber_trust";
function setTrustCookie(res, token) {
  res.setHeader("Set-Cookie", TRUST_COOKIE + "=" + encodeURIComponent(token) + "; Max-Age=" + (TRUST_DAYS * 24 * 3600) + "; Path=/; HttpOnly; Secure; SameSite=Lax");
}
function clearTrustCookie(res) {
  res.setHeader("Set-Cookie", TRUST_COOKIE + "=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax");
}
function readTrustCookie(req) {
  const m = String(req.headers.cookie || "").match(/(?:^|;\s*)amber_trust=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

async function logAuth(svc, o) {
  try { await svc.from("auth_logs").insert({ user_id: o.user_id || null, email: o.email || null, event: o.event,
    status: o.status || "info", reason: o.reason || null, ip: o.ip || null, device: o.device || null }); } catch (e) {}
}
async function sendOtpEmail(email, code) {
  if (!RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST",
      headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: [email],
        subject: "Your Amber Homes verification code: " + code,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:8px"><h2 style="color:#0e1828;margin:0 0 8px">Amber Homes CRM</h2><p style="color:#333;margin:0 0 14px">Your sign-in verification code is:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0e1828;background:#f5f1e8;border-radius:10px;padding:16px;text-align:center">${code}</div><p style="color:#888;font-size:12.5px;margin:14px 0 0">This code expires in 10 minutes and can be used once. If you didn't try to sign in, you can ignore this email.</p></div>` }) });
    return r.ok;
  } catch (e) { return false; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, reason: "method" });
  if (!SERVICE_KEY) return res.status(500).json({ ok: false, reason: "server_unconfigured" });
  const svc = svcClient();
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null;
  const device = String(req.headers["user-agent"] || "").slice(0, 240) || null;
  const reqBody = req.body || {};
  const { action, password, code } = reqBody;
  const email = String(reqBody.email || "").trim().toLowerCase();

  try {
    if (action === "rehydrate") {
      const tok = readTrustCookie(req);
      if (!tok) return res.status(200).json({ ok: false, reason: "no_cookie" });
      try {
        const th = sha256pep(tok);
        const { data: sess } = await svc.from("user_device_sessions")
          .select("id, user_id, trusted_until, is_active, revoked_at")
          .eq("session_id_hash", th).limit(1).maybeSingle();
        if (!sess || !sess.is_active || sess.revoked_at || !sess.trusted_until || new Date(sess.trusted_until).getTime() <= Date.now()) {
          clearTrustCookie(res);
          return res.status(200).json({ ok: false, reason: "expired" });
        }
        const { data: rprof } = await svc.from("profiles").select("email, active").eq("id", sess.user_id).maybeSingle();
        if (!rprof || rprof.active === false) { clearTrustCookie(res); return res.status(200).json({ ok: false, reason: "inactive" }); }
        const remail = String(rprof.email || "").trim().toLowerCase();
        const { data: rlink, error: rErr } = await svc.auth.admin.generateLink({ type: "magiclink", email: remail });
        if (rErr || !rlink?.properties?.hashed_token) return res.status(200).json({ ok: false, reason: "server" });
        await svc.from("user_device_sessions").update({ last_seen_at: new Date().toISOString(), ip_address: ip, user_agent: device }).eq("id", sess.id);
        setTrustCookie(res, tok);
        await logAuth(svc, { user_id: sess.user_id, email: remail, event: "trusted_session_refreshed", status: "ok", reason: "rehydrate", ip, device });
        await logAuth(svc, { user_id: sess.user_id, email: remail, event: "login_success", status: "ok", reason: "rehydrate", ip, device });
        return res.status(200).json({ ok: true, token_hash: rlink.properties.hashed_token });
      } catch (e) { return res.status(200).json({ ok: false, reason: "server" }); }
    }

    if (action === "logout") {
      try {
        const tok = readTrustCookie(req);
        if (tok) { const th = sha256pep(tok); await svc.from("user_device_sessions").update({ is_active: false, revoked_at: new Date().toISOString(), revoked_reason: "logout" }).eq("session_id_hash", th); }
      } catch (e) {}
      clearTrustCookie(res);
      return res.status(200).json({ ok: true });
    }

    if (action === "start") {
      if (!email || !password) return res.status(400).json({ ok: false, reason: "missing" });
      await logAuth(svc, { email, event: "login_attempt", ip, device });
      const anon = anonClient();
      const { data: signIn, error: sErr } = await anon.auth.signInWithPassword({ email, password });
      if (sErr || !signIn?.user) {
        const reason = /confirm/i.test(sErr?.message || "") ? "email_unconfirmed" : "bad_credentials";
        await logAuth(svc, { email, event: "login_failed", status: "fail", reason, ip, device });
        return res.status(200).json({ ok: false, reason });
      }
      const uid = signIn.user.id;
      try { await anon.auth.signOut(); } catch (e) {}
      const { data: prof } = await svc.from("profiles").select("active, role, twofa_required, force_password_change, first_login, password_expires_at").eq("id", uid).single();
      if (!prof) return res.status(200).json({ ok: false, reason: "no_profile" });
      if (prof.active === false) { await logAuth(svc, { user_id: uid, email, event: "account_inactive", status: "fail", ip, device }); return res.status(200).json({ ok: false, reason: "inactive" }); }
      const now = Date.now();
      const expired = !!(prof.password_expires_at && new Date(prof.password_expires_at).getTime() < now);
      const mustChange = !!prof.force_password_change || !!prof.first_login || expired;
      const needs2fa = prof.twofa_required === true;

      // ---- Trusted-device fast path: a device that completed 2FA within the last 7 days skips 2FA. ----
      const deviceId = String(reqBody.deviceId || "").slice(0, 200);
      const trustToken = String(reqBody.trustToken || "");
      if (needs2fa && deviceId && trustToken) {
        try {
          const dh = sha256pep(deviceId), th = sha256pep(trustToken);
          const { data: sess } = await svc.from("user_device_sessions")
            .select("id, trusted_until, is_active, revoked_at")
            .eq("user_id", uid).eq("device_id_hash", dh).eq("session_id_hash", th).limit(1).maybeSingle();
          if (sess && sess.is_active && !sess.revoked_at && sess.trusted_until && new Date(sess.trusted_until).getTime() > now) {
            await svc.from("user_device_sessions").update({ last_seen_at: new Date().toISOString(), ip_address: ip, user_agent: device }).eq("id", sess.id);
            const { data: link2, error: lErr2 } = await svc.auth.admin.generateLink({ type: "magiclink", email });
            if (!lErr2 && link2?.properties?.hashed_token) {
              await logAuth(svc, { user_id: uid, email, event: "trusted_session_refreshed", status: "ok", reason: "trusted_device", ip, device });
              await logAuth(svc, { user_id: uid, email, event: "login_success", status: "ok", reason: "trusted_device", ip, device });
              setTrustCookie(res, trustToken);
              return res.status(200).json({ ok: true, needs2fa: false, token_hash: link2.properties.hashed_token, mustChange, expired, trusted: true });
            }
          }
        } catch (e) {}
      }

      if (needs2fa && RESEND_API_KEY) {
        const codeV = gen4();
        await svc.from("auth_otp").delete().eq("email", email);
        await svc.from("auth_otp").insert({ user_id: uid, email, code_hash: hashCode(codeV, email), expires_at: new Date(now + 10 * 60 * 1000).toISOString() });
        const sent = await sendOtpEmail(email, codeV);
        if (!sent) { await logAuth(svc, { user_id: uid, email, event: "2fa_sent", status: "fail", reason: "email_send_failed", ip, device }); return res.status(200).json({ ok: false, reason: "email_send_failed" }); }
        await logAuth(svc, { user_id: uid, email, event: "2fa_sent", status: "ok", ip, device });
        return res.status(200).json({ ok: true, needs2fa: true, mustChange, expired });
      }
      // No 2FA required (or email not configured yet) -> mint a session immediately.
      const { data: link, error: lErr } = await svc.auth.admin.generateLink({ type: "magiclink", email });
      if (lErr || !link?.properties?.hashed_token) { await logAuth(svc, { user_id: uid, email, event: "login_failed", status: "fail", reason: "session_mint", ip, device }); return res.status(200).json({ ok: false, reason: "server" }); }
      await logAuth(svc, { user_id: uid, email, event: "login_success", status: "ok", reason: needs2fa ? "2fa_skipped_no_email" : null, ip, device });
      return res.status(200).json({ ok: true, needs2fa: false, token_hash: link.properties.hashed_token, mustChange, expired });
    }

    if (action === "verify_2fa") {
      if (!email || !code) return res.status(400).json({ ok: false, reason: "missing" });
      const { data: rows } = await svc.from("auth_otp").select("*").eq("email", email).order("created_at", { ascending: false }).limit(1);
      const otp = rows && rows[0];
      if (!otp || otp.used) { await logAuth(svc, { email, event: "2fa_failed", status: "fail", reason: "no_code", ip, device }); return res.status(200).json({ ok: false, reason: "invalid" }); }
      if (new Date(otp.expires_at).getTime() < Date.now()) { await logAuth(svc, { email, event: "2fa_expired", status: "fail", ip, device }); return res.status(200).json({ ok: false, reason: "expired" }); }
      if (otp.attempts >= 5) { await logAuth(svc, { email, event: "account_locked", status: "fail", reason: "otp_attempts", ip, device }); return res.status(200).json({ ok: false, reason: "locked" }); }
      if (otp.code_hash !== hashCode(code, email)) {
        await svc.from("auth_otp").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
        await logAuth(svc, { email, event: "2fa_failed", status: "fail", reason: "wrong_code", ip, device });
        return res.status(200).json({ ok: false, reason: "invalid", remaining: Math.max(0, 5 - (otp.attempts + 1)) });
      }
      await svc.from("auth_otp").update({ used: true }).eq("id", otp.id);
      const { data: prof } = await svc.from("profiles").select("id, force_password_change, first_login, password_expires_at").eq("email", email).single();
      const now = Date.now(); const expired = !!(prof?.password_expires_at && new Date(prof.password_expires_at).getTime() < now);
      const mustChange = !!(prof?.force_password_change) || !!(prof?.first_login) || expired;
      const { data: link, error: lErr } = await svc.auth.admin.generateLink({ type: "magiclink", email });
      if (lErr || !link?.properties?.hashed_token) return res.status(200).json({ ok: false, reason: "server" });
      await logAuth(svc, { user_id: prof?.id || null, email, event: "two_factor_verified", status: "ok", ip, device });
      await logAuth(svc, { user_id: prof?.id || null, email, event: "login_success", status: "ok", ip, device });
      // ---- Create / refresh this device's 7-day trusted session (max 2 active; oldest revoked on overflow). ----
      const dev2fa = String(reqBody.deviceId || "").slice(0, 200);
      if (dev2fa && prof?.id) {
        try {
          const uid2 = prof.id;
          const trustTokenNew = genTrustToken();
          const dh = sha256pep(dev2fa), th = sha256pep(trustTokenNew);
          const nowIso = new Date().toISOString();
          const trustedUntil = new Date(Date.now() + TRUST_DAYS * 24 * 3600 * 1000).toISOString();
          const { data: already } = await svc.from("user_device_sessions").select("id").eq("user_id", uid2).eq("device_id_hash", dh).limit(1).maybeSingle();
          if (!already) {
            const { data: act } = await svc.from("user_device_sessions").select("id, created_at")
              .eq("user_id", uid2).eq("is_active", true).is("revoked_at", null).gt("trusted_until", nowIso).order("created_at", { ascending: true });
            if (act && act.length >= MAX_TRUSTED_DEVICES) {
              for (const rr of act.slice(0, act.length - (MAX_TRUSTED_DEVICES - 1))) {
                await svc.from("user_device_sessions").update({ is_active: false, revoked_at: nowIso, revoked_reason: "third_device_login" }).eq("id", rr.id);
                await logAuth(svc, { user_id: uid2, email, event: "session_revoked_due_to_third_device", status: "ok", ip, device });
              }
            }
          }
          const p = uaParts(device);
          await svc.from("user_device_sessions").upsert({
            user_id: uid2, device_id_hash: dh, session_id_hash: th,
            device_label: p.label, browser: p.browser, os: p.os, ip_address: ip, user_agent: device,
            last_seen_at: nowIso, last_2fa_verified_at: nowIso, trusted_until: trustedUntil,
            revoked_at: null, revoked_reason: null, is_active: true,
          }, { onConflict: "user_id,device_id_hash" });
          await logAuth(svc, { user_id: uid2, email, event: "trusted_session_created", status: "ok", ip, device });
          setTrustCookie(res, trustTokenNew);
          return res.status(200).json({ ok: true, token_hash: link.properties.hashed_token, mustChange, expired, trustToken: trustTokenNew });
        } catch (e) {}
      }
      return res.status(200).json({ ok: true, token_hash: link.properties.hashed_token, mustChange, expired });
    }

    if (action === "resend") {
      if (!email) return res.status(400).json({ ok: false, reason: "missing" });
      if (!RESEND_API_KEY) return res.status(200).json({ ok: false, reason: "email_send_failed" });
      const { data: rows } = await svc.from("auth_otp").select("created_at").eq("email", email).order("created_at", { ascending: false }).limit(1);
      const last = rows && rows[0];
      if (last && (Date.now() - new Date(last.created_at).getTime()) < 30 * 1000) return res.status(200).json({ ok: false, reason: "too_soon" });
      const { data: prof } = await svc.from("profiles").select("id").eq("email", email).single();
      if (!prof) return res.status(200).json({ ok: false, reason: "invalid" });
      const codeV = gen4();
      await svc.from("auth_otp").delete().eq("email", email);
      await svc.from("auth_otp").insert({ user_id: prof.id, email, code_hash: hashCode(codeV, email), expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
      const sent = await sendOtpEmail(email, codeV);
      await logAuth(svc, { user_id: prof.id, email, event: "2fa_sent", status: sent ? "ok" : "fail", reason: sent ? "resend" : "email_send_failed", ip, device });
      return res.status(200).json({ ok: !!sent, reason: sent ? null : "email_send_failed" });
    }

    if (action === "after_password_change") {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ ok: false });
      const { data: who, error } = await svc.auth.getUser(token);
      if (error || !who?.user) return res.status(401).json({ ok: false });
      const uid = who.user.id;
      const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
      await svc.from("profiles").update({ force_password_change: false, first_login: false, password_last_changed_at: new Date().toISOString(), password_expires_at: expires }).eq("id", uid);
      await logAuth(svc, { user_id: uid, email: who.user.email, event: "password_changed", status: "ok", ip, device });
      try { await svc.from("user_device_sessions").update({ is_active: false, revoked_at: new Date().toISOString(), revoked_reason: "password_changed" }).eq("user_id", uid).eq("is_active", true); } catch (e) {}
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, reason: "unknown_action" });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server" });
  }
}
