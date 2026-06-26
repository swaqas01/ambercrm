#!/usr/bin/env node
/**
 * Amber Homes CRM — Permanent Security Scanner
 * ------------------------------------------------------------------
 * Simulates an ANONYMOUS internet attacker holding only the public
 * key (the same thing that ships in the browser bundle) and proves,
 * on every run, that none of your private data is reachable without
 * a real login. This is the automated version of the external audit
 * that found the June 2026 exposure — so that class of mistake can
 * never ship silently again.
 *
 * It runs FOUR families of check:
 *   1. ANON READ   — can a logged-out attacker read sensitive tables?
 *   2. ANON WRITE  — can a logged-out attacker insert/modify data?
 *   3. SIGNUP      — can a stranger register themselves an account?
 *   4. SHIP HYGIENE— is a service-role key in the bundle? headers set?
 *
 * Exit code 0 = all clear. Exit code 1 = at least one FAIL (use this
 * to block a deploy). A check that cannot run (e.g. no network) is
 * reported as ERROR and also fails the run — silence is never a pass.
 *
 * Usage:
 *   node scripts/security-check.mjs            # full scan
 *   node scripts/security-check.mjs --no-write # skip write probes
 *   SUPABASE_URL=... ANON_KEY=... node scripts/security-check.mjs
 *
 * The URL and anon key below are PUBLIC by design (the anon key is in
 * every visitor's browser already), so the scanner needs no secrets.
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://fkeniejcitwlqfatkopi.supabase.co";

const ANON_KEY =
  process.env.ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";

const PRODUCTION_URL = process.env.PRODUCTION_URL || "https://crm.amberhomes.ai";

const SKIP_WRITE = process.argv.includes("--no-write");
const SKIP_HEADERS = process.argv.includes("--no-headers");

/**
 * Every table that holds private business data. If an anonymous
 * request returns a single row from ANY of these, that is a breach
 * waiting to happen and the scan fails. Add new tables here the day
 * you create them — that is the one manual step that keeps this honest.
 */
const SENSITIVE_TABLES = [
  "leads", "lead_activity", "lead_comments", "lead_reveals",
  "lead_ownership_history", "follow_ups", "hot_resale_deals",
  "deals", "deal_activity", "deal_documents",
  "projects", "project_files",
  "profiles", "agent_profiles", "agent_targets", "default_agent_targets",
  "target_history",
  "app_settings", "open_leads_settings",
  "ai_knowledge", "ai_sources", "ai_messages", "ai_feedback",
  "ai_logs", "ai_web_log",
  "notifications", "auth_logs", "auth_otp", "admin_audit",
  "data_calling", "data_calling_activity", "data_calling_assignment",
  "file_downloads", "push_subscriptions", "user_devices",
  "user_device_sessions", "security_alerts",
];

const H = {
  apikey: ANON_KEY,
  Authorization: "Bearer " + ANON_KEY,
};

// ── tiny result tracker ────────────────────────────────────────────
let FAILS = 0, PASSES = 0, ERRORS = 0;
const lines = [];
function pass(msg) { PASSES++; lines.push(`  \x1b[32mPASS\x1b[0m  ${msg}`); }
function fail(msg) { FAILS++; lines.push(`  \x1b[31mFAIL\x1b[0m  ${msg}`); }
function err(msg)  { ERRORS++; lines.push(`  \x1b[33mERROR\x1b[0m ${msg}`); }
function head(t)   { lines.push(`\n\x1b[1m${t}\x1b[0m`); }

async function timed(url, opts = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    return r;
  } finally { clearTimeout(to); }
}

// A response carrying x-deny-reason came from a network egress proxy, NOT from
// Supabase — the request never arrived, so the test did not actually run. This
// must never be counted as a pass. (This is the exact false-positive that makes
// security tooling lie to you.)
function proxyBlocked(r) { return !!r.headers.get("x-deny-reason"); }

// Prove we can actually reach Supabase before trusting a single result.
async function preflight() {
  try {
    const r = await timed(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: ANON_KEY } });
    if (proxyBlocked(r)) return { ok: false, why: `network egress blocked (${r.headers.get("x-deny-reason")})` };
    return { ok: true };
  } catch (e) { return { ok: false, why: `cannot reach Supabase: ${e.message}` }; }
}

// ── 1. ANON READ ───────────────────────────────────────────────────
async function checkAnonRead() {
  head("1. Anonymous READ — can a logged-out attacker read private tables?");
  for (const t of SENSITIVE_TABLES) {
    const url = `${SUPABASE_URL}/rest/v1/${t}?select=*&limit=1`;
    try {
      const r = await timed(url, { headers: H });
      if (proxyBlocked(r)) { err(`${t} — NOT TESTED: blocked by network before reaching Supabase (${r.headers.get("x-deny-reason")})`); continue; }
      if (r.status === 401 || r.status === 403) { pass(`${t} — denied (${r.status})`); continue; }
      if (r.status === 200) {
        let body;
        try { body = await r.json(); } catch { body = null; }
        if (Array.isArray(body) && body.length === 0) { pass(`${t} — empty (no rows leaked)`); }
        else { fail(`${t} — RETURNED DATA to anonymous request (${Array.isArray(body) ? body.length : "?"} row[s]). EXPOSED.`); }
      } else {
        // 404 = table not exposed in API / doesn't exist → not a leak
        if (r.status === 404) pass(`${t} — not exposed (404)`);
        else err(`${t} — unexpected status ${r.status}`);
      }
    } catch (e) { err(`${t} — request failed: ${e.message}`); }
  }
}

// ── 2. ANON WRITE ──────────────────────────────────────────────────
// Attempts a forged INSERT as an anonymous user. A correct system
// rejects it (401/403). If it is ACCEPTED, a canary row is created and
// flagged for manual deletion — that itself is the proof of the hole.
async function checkAnonWrite() {
  head("2. Anonymous WRITE — can a logged-out attacker forge/insert data?");
  if (SKIP_WRITE) { lines.push("  (skipped via --no-write)"); return; }
  const stamp = "SECCHECK-CANARY-" + Date.now();
  const probes = [
    { t: "leads", row: { client_name: stamp, normalized_phone: "+000000000000" } },
    { t: "lead_comments", row: { body: stamp } },
  ];
  for (const p of probes) {
    const url = `${SUPABASE_URL}/rest/v1/${p.t}`;
    try {
      const r = await timed(url, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(p.row),
      });
      if (proxyBlocked(r)) { err(`${p.t} — NOT TESTED: network blocked the request`); continue; }
      if (r.status === 401 || r.status === 403) { pass(`${p.t} — insert denied (${r.status})`); }
      else if (r.status >= 200 && r.status < 300) {
        fail(`${p.t} — ANONYMOUS INSERT ACCEPTED (${r.status}). A canary row "${stamp}" may now exist — delete it and close write access immediately.`);
      } else { pass(`${p.t} — insert rejected (${r.status})`); }
    } catch (e) { err(`${p.t} — write probe failed: ${e.message}`); }
  }
}

// ── 3. PUBLIC SIGNUP ───────────────────────────────────────────────
async function checkSignup() {
  head("3. Public SIGNUP — can a stranger register an account?");
  const url = `${SUPABASE_URL}/auth/v1/signup`;
  const email = `seccheck-canary+${Date.now()}@example.com`;
  try {
    const r = await timed(url, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Sec-Check-" + Date.now() + "!aZ" }),
    });
    if (proxyBlocked(r)) { err("signup — NOT TESTED: network blocked the request"); return; }
    let body; try { body = await r.json(); } catch { body = {}; }
    const msg = JSON.stringify(body).toLowerCase();
    if (r.status === 422 || msg.includes("signups not allowed") || msg.includes("signup is disabled") || msg.includes("not allowed for this instance")) {
      pass("public signup is DISABLED (stranger registration blocked)");
    } else if (r.status >= 200 && r.status < 300) {
      fail(`public signup is ENABLED — a stranger can register. Response created/accepted an account for ${email}. Disable in Auth → Providers → Email.`);
    } else {
      err(`signup probe returned ${r.status} — verify manually in the Auth dashboard`);
    }
  } catch (e) { err(`signup probe failed: ${e.message}`); }
}

// ── 4a. SERVICE-ROLE KEY IN BUNDLE ─────────────────────────────────
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|cjs|html|map)$/.test(f)) out.push(p);
  }
  return out;
}

function checkBundleSecrets() {
  head("4a. Bundle hygiene — is a privileged key leaking into the frontend?");
  const distDir = ["dist", "build", ".vercel/output/static"].find((d) => existsSync(join(process.cwd(), d)));
  if (!distDir) { err("no build output found (run `npm run build` first) — cannot scan bundle"); return; }
  const files = walk(join(process.cwd(), distDir));
  // A service-role JWT contains the claim "service_role"; any JWT in the
  // bundle other than the known publishable key is suspicious.
  const jwtRe = /eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g;
  let found = false;
  for (const f of files) {
    const txt = readFileSync(f, "utf8");
    if (txt.includes("service_role")) { fail(`"service_role" string present in ${f.replace(process.cwd(), ".")} — investigate immediately`); found = true; }
    const jwts = txt.match(jwtRe) || [];
    for (const j of jwts) {
      // decode the middle segment to look for the dangerous claim
      try {
        const payload = JSON.parse(Buffer.from(j.split(".")[1], "base64").toString("utf8"));
        if (payload.role === "service_role") { fail(`SERVICE-ROLE JWT embedded in ${f.replace(process.cwd(), ".")} — rotate the key and remove it NOW`); found = true; }
      } catch { /* not a decodable JWT, ignore */ }
    }
  }
  if (!found) pass(`no service-role key or JWT found in ${distDir}/ (scanned ${files.length} files)`);
}

// ── 4b. SECURITY HEADERS ───────────────────────────────────────────
async function checkHeaders() {
  head("4b. Security headers — is the live site sending browser protections?");
  if (SKIP_HEADERS) { lines.push("  (skipped via --no-headers)"); return; }
  try {
    const r = await timed(PRODUCTION_URL, { method: "GET", headers: { "User-Agent": "amber-security-check" } });
    if (proxyBlocked(r)) { err(`headers — NOT TESTED: network blocked ${PRODUCTION_URL}`); return; }
    const need = {
      "content-security-policy": "Content-Security-Policy",
      "x-content-type-options": "X-Content-Type-Options",
      "referrer-policy": "Referrer-Policy",
      "permissions-policy": "Permissions-Policy",
      "strict-transport-security": "HSTS (Strict-Transport-Security)",
    };
    const csp = r.headers.get("content-security-policy") || "";
    for (const [k, label] of Object.entries(need)) {
      if (r.headers.get(k)) pass(`${label} present`);
      else fail(`${label} MISSING on ${PRODUCTION_URL}`);
    }
    // frame protection can come from either header
    if (r.headers.get("x-frame-options") || /frame-ancestors/.test(csp)) pass("clickjacking protection present (X-Frame-Options or frame-ancestors)");
    else fail("no clickjacking protection (add X-Frame-Options or CSP frame-ancestors)");
  } catch (e) { err(`could not fetch ${PRODUCTION_URL}: ${e.message}`); }
}

// ── run ────────────────────────────────────────────────────────────
(async () => {
  console.log("\n\x1b[1m🔒 Amber Homes CRM — Security Scan\x1b[0m");
  console.log(`   target: ${SUPABASE_URL}`);
  console.log(`   site:   ${PRODUCTION_URL}`);
  console.log(`   time:   ${new Date().toISOString()}`);

  const pf = await preflight();
  if (!pf.ok) {
    console.log(`\n\x1b[33m\x1b[1m⚠ Live checks cannot run: ${pf.why}\x1b[0m`);
    console.log("  This environment has no network route to Supabase, so the anon/signup/header");
    console.log("  probes would test nothing. Run the scanner from your machine or GitHub Actions");
    console.log("  (both can reach Supabase). The offline bundle scan still runs below.\n");
    checkBundleSecrets();
    console.log(lines.join("\n"));
    console.log("\n" + "─".repeat(60));
    console.log("\x1b[33m\x1b[1m⚠ INCOMPLETE — live security checks did not run in this environment.\x1b[0m\n");
    process.exit(2); // distinct from 0 (pass) and 1 (fail): "could not verify"
  }

  await checkAnonRead();
  await checkAnonWrite();
  await checkSignup();
  checkBundleSecrets();
  await checkHeaders();

  console.log(lines.join("\n"));
  console.log("\n" + "─".repeat(60));
  console.log(`\x1b[1mResult:\x1b[0m ${PASSES} passed, ${FAILS} failed, ${ERRORS} error(s)`);
  if (FAILS > 0 || ERRORS > 0) {
    console.log("\x1b[31m\x1b[1m✗ SECURITY CHECK FAILED — do not deploy until resolved.\x1b[0m\n");
    process.exit(1);
  }
  console.log("\x1b[32m\x1b[1m✓ All security checks passed.\x1b[0m\n");
  process.exit(0);
})();
