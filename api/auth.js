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
  const { action, password, code } = req.body || {};
  const email = String((req.body || {}).email || "").trim().toLowerCase();

  try {
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
      const { data: prof } = await svc.from("profiles").select("force_password_change, first_login, password_expires_at").eq("email", email).single();
      const now = Date.now(); const expired = !!(prof?.password_expires_at && new Date(prof.password_expires_at).getTime() < now);
      const mustChange = !!(prof?.force_password_change) || !!(prof?.first_login) || expired;
      const { data: link, error: lErr } = await svc.auth.admin.generateLink({ type: "magiclink", email });
      if (lErr || !link?.properties?.hashed_token) return res.status(200).json({ ok: false, reason: "server" });
      await logAuth(svc, { user_id: prof ? undefined : null, email, event: "2fa_success", status: "ok", ip, device });
      await logAuth(svc, { email, event: "login_success", status: "ok", ip, device });
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
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, reason: "unknown_action" });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server" });
  }
}
