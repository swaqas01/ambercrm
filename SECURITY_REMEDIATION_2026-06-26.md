# Amber Homes CRM — Security Remediation (26 Jun 2026)

Fixes for the External Security Assessment (F-1…F-7). Code fixes are **deployed**; the DB migrations
and the sign-up toggle are run by you in Supabase. Nothing here deletes data, resets the DB, rebuilds
the CRM, or weakens any existing role.

> Note: part of this was done across two sessions. Migrations **49 & 50** (the anonymous-role revoke)
> may already be applied. Running them again is harmless (idempotent). Run **49 → 50 → 51 in order**.

---

## Root cause (confirmed on the live DB)
RLS is enabled, but the SELECT policies on the ten tables target the **public** role (which includes the
logged-out `anon` role) and each has a **login-optional branch** — `leads.is_open=true`,
`projects.agent_visible=true`, `ai_knowledge/ai_sources active`, `app_settings using(true)`,
`hot_resale_deals status='Approved'`, and the open-lead branches on `lead_activity/lead_comments/follow_ups`.
So an anonymous visitor with the public key matched those branches and read the rows.

## ✅ Deployed (code, auto-deployed via Vercel)
- **F-5 Security headers** in `vercel.json`: full app-tuned **Content-Security-Policy** (Supabase https+wss,
  Google Fonts, jsPDF blob preview, inline styles, hashed PWA script — verified not to break the CRM,
  Ask Amber, images, or the PWA) + X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy, HSTS.
- **F-4 fix** — `api/ai.js` now reads `app_settings.web_research_enabled` + `ai_sources` with the
  **service-role key (server-side only)**. This is required: once `anon` is revoked (below), the AI proxy
  could no longer read those with the public key, which would have silently disabled the Master Admin's
  web-research kill-switch and custom domain whitelist. Now they keep working.

## 🟥 STEP 1 — Run the DB migrations (fixes F-1, F-3, F-4)  ~3 min
Supabase → **SQL Editor** → New query → paste each file's contents → **Run**, in this order:
1. `supabase/49_close_anon_read_exposure.sql`  — revoke all anon privileges on the 10 tables (may be done).
2. `supabase/50_security_anon_lockdown.sql`     — same revoke + lock app_settings/ai_sources reads (may be done).
3. `supabase/51_security_rls_and_scope.sql`     — ensure RLS on all 10 + tighten app_settings (Admin/Master)
                                                  & ai_knowledge (authenticated) reads.
The SELECT at the end of 51 must show **rls_on = true** and **policies > 0** for all ten tables.

## 🟥 STEP 2 — Disable public sign-up (fixes F-2)  ~1 min
Supabase → **Authentication** → **Sign In / Providers** → **Email** → turn **OFF**
“**Allow new users to sign up**” → **Save**.
- Safe: the CRM never calls `signUp`. Login uses password sign-in + admin-generated magic links; new
  users are created only by Master/Admin via `api/admin.js`. Login, email-2FA and password reset for
  existing users are unaffected.

## 🟩 STEP 3 — Verify (read-only)
Run `supabase/VERIFY_security_2026-06-26.sql` (and/or `VERIFY_anon_exposure.sql`) and check each block.
Key expectations: anon has **(none)** privileges on the 10 tables; **zero** anon/permissive read policies;
**zero** anon-executable functions; `deal-docs` bucket **private**.

### External black-box test (your Mac Terminal) — matches the auditor's method
```bash
KEY="sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ"
API="https://fkeniejcitwlqfatkopi.supabase.co/rest/v1"
# READ — after STEP 1 every table must show */0 (zero rows) or a permission error. Before, leads=.../2574.
for t in leads lead_activity lead_comments ai_knowledge ai_sources app_settings projects project_files hot_resale_deals follow_ups; do
  printf "%-18s " "$t"
  curl -s -I "$API/$t?select=*" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Prefer: count=exact" -H "Range: 0-0" | grep -i content-range || echo "(blocked)"
done
# WRITE/DELETE blocked — run AFTER STEP 1. Expect 401/403, never success. Zero-impact (fake/no-match).
curl -s -o /dev/null -w "anon insert -> %{http_code}\n" -X POST "$API/leads" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"client_name":"sec-test-DELETE-ME"}'
curl -s -o /dev/null -w "anon delete -> %{http_code}\n" -X DELETE "$API/leads?id=eq.00000000-0000-0000-0000-000000000000" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

### In-app smoke test (logged in)
Agent sees only own/open leads · comments/follow-ups/history save · dashboards load · Ask Amber answers
(knowledge + web) · Master AI Sources + admin Devices screens load · deal PDF preview opens.

## 🟨 STEP 4 — Storage buckets (F-6)
`VERIFY` block 5 lists bucket privacy:
- **deal-docs** = private (`is_public=false`) — correct; downloads use signed URLs. ✅
- **avatars** = public — intentional profile photos. ✅
- **project-files** = public-by-URL (listing already disabled). Project docs are reachable by anyone with
  the exact link — **residual LOW risk**. To fully close it: make the bucket private + serve via signed
  URLs (same as deal-docs). Needs a small app change + test pass — say the word and I'll ship it.

## ℹ️ F-7 (schema names visible) — by design; no action. Defense is RLS + function checks (in place).
