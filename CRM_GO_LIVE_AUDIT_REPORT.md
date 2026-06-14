# Amber Homes CRM — Pre-Go-Live Audit Report

**Date:** 14 Jun 2026
**Production:** https://crm.amberhomes.ai  ·  **Staging:** https://ambercrm.vercel.app
**Auditor:** automated code↔database consistency audit of the repository (`swaqas01/ambercrm`)

---

## 0. Read this first — scope and verification boundary

This audit was performed against the **full source repository and all 24 SQL migration files**. That is exactly where the "missed migrations" problem lives, and it is fully inspectable.

Two things **cannot** be verified from the codebase and are therefore handed to you as explicit checklists rather than asserted as facts:

1. **Live database state** — which migrations are actually applied in your Supabase project. I have no live DB connection. The single verification query in §2 settles this in 5 seconds.
2. **Dashboard / runtime configuration** — which Storage buckets exist, whether backups are on, Auth redirect URLs, and whether the server environment variables are set in Vercel. These are in `PRODUCTION_SAFETY_CHECKLIST.md`.

Everything stated as **VERIFIED** below was checked mechanically in the code. Everything stated as **VERIFY** is yours to confirm in the dashboard.

**Headline result:** the "missed migrations" issue was a *deployment* problem (migrations written but never run in Supabase), **not** a code problem. The code and schema are consistent. Exactly **one** concrete code↔database gap was found (the `avatars` storage bucket) and a safe repair migration (`24_pre_go_live_repair.sql`) was written for it.

---

## 1. Findings summary (by priority)

| # | Finding | Priority | Status |
|---|---------|----------|--------|
| 1 | Several migrations (07, 16–23) were never run in Supabase — the root cause of "built in frontend, not connected to DB" | **Critical** | Being fixed — you are running them now; confirm with §2 query |
| 2 | `avatars` storage bucket used by profile-photo upload has **no migration** (unlike project-files/deal-docs) | **High** | **Fixed** — `24_pre_go_live_repair.sql` creates it safely |
| 3 | Server env vars (service role, Anthropic, Resend, OTP pepper) must be set in Vercel for user-management, Ask Amber, email, and 2FA to work | **High** | VERIFY in Vercel (checklist) |
| 4 | Supabase Auth redirect/site URLs must point to `crm.amberhomes.ai` (not localhost) for password reset/login | **High** | VERIFY in dashboard (checklist) |
| 5 | Supabase automated backups / PITR before go-live | **High** | VERIFY in dashboard (checklist) |
| 6 | Hard DB-level duplicate-phone block is intentionally left commented until existing duplicates are resolved | **Medium** | By design — run dedup report then enable (see §6) |
| 7 | `security_overview` RPC exists but its admin UI (Security Watch) and Ask Amber reports are Wave 2 (not yet built) | **Medium** | Known — backend ready, UI pending |
| 8 | Reveal-to-action "no follow-up" alert needs a scheduled job (pg_cron / Vercel Cron) to fire automatically | **Low** | Known — data captured now, automation pending |
| 9 | Code↔schema column naming, RPC references, table references, secret isolation | — | **VERIFIED consistent — no action** |

There were **no** Critical/High **code** defects: no missing RPCs, no missing tables, no column mismatches, no leaked secrets.

---

## 2. Migration status checklist

All 24 migrations are **idempotent and safe to re-run** (verified: every `create table`/`policy`/`trigger`/`index` uses `if not exists` or `drop … if exists`; no migration deletes, truncates, or overwrites real data). **Do not run `02`** — it is the only one that inserts sample/demo leads.

| Migration | Purpose | Safe to apply | Notes |
|-----------|---------|:---:|-------|
| 01_schema | Core tables, RLS, helper fns (`is_admin`, `is_master`), auth trigger | ✅ | Applied (app runs) |
| 02_import_leads | **Sample/demo leads** | ⛔ | **Skip — inserts demo data** |
| 03_fixes | Lead column fixes (`followup_note`, etc.) | ✅ | |
| 04_users | Users/agents admin | ✅ | |
| 05_leaddetail | Lead detail support | ✅ | |
| 06_ai_logs / 09_ai_logs | AI logging | ✅ | |
| 07_ai_knowledge | **Creates `ai_knowledge`** + seed | ✅ | Was missing — now run |
| 08_projects | Projects + **`project-files` bucket** | ✅ | |
| 10_deals | Deals + **`deal-docs` bucket** | ✅ | |
| 11_auth | OTP/2FA tables (`auth_otp`, `auth_logs`) | ✅ | |
| 12_followups | Follow-ups + **`guard_protected_columns`** (agent field lock) | ✅ | |
| 13_hotdeals | Hot resale deals (`project_name` lives here) | ✅ | |
| 14_ai_sources | Approved AI web sources | ✅ | |
| 15_perf_indexes | Performance indexes | ✅ | |
| 16_master_admin | **Enforce saad@amberhomes.ae = master_admin** | ✅ | Run it |
| 17_knowledge_seed | 139 KB entries (dollar-quoted, copy-safe) | ✅ | Idempotent (`where not exists`) |
| 18_agent_photos_perf | Agent photos + perf | ✅ | |
| 19_founder_knowledge | Founder's Knowledge (dollar-quoted) | ✅ | Idempotent |
| 20_lead_type_and_open_leads | `lead_type` column + `open_leads_settings` + auto-open | ✅ | Was missing — caused the leads-load error |
| 21_launch_focus_seed | Launch focus KB (dollar-quoted) | ✅ | Idempotent |
| 22_phone_dedup | `normalize_phone`, `normalized_phone`, `check_duplicate_phone` | ✅ | Was missing |
| 23_open_leads_security | Reveal quota/alerts, `lead_reveals`, `security_alerts`, RPCs | ✅ | Was missing |
| 24_pre_go_live_repair | **`avatars` bucket + policies** (this audit) | ✅ | **New — run it** |

**Confirm applied state — paste into SQL Editor and Run:**

```sql
select
  (select count(*) from pg_proc where proname in
    ('reveal_contact','mark_lead_open','assign_open_lead','security_overview','check_duplicate_phone','normalize_phone','auto_open_stale_leads')) as rpcs_expect_7,
  to_regclass('public.lead_reveals')    is not null as t_lead_reveals,
  to_regclass('public.security_alerts') is not null as t_security_alerts,
  to_regclass('public.ai_knowledge')    is not null as t_ai_knowledge,
  exists(select 1 from information_schema.columns where table_name='leads' and column_name='lead_type')         as c_lead_type,
  exists(select 1 from information_schema.columns where table_name='leads' and column_name='normalized_phone')  as c_normalized_phone,
  exists(select 1 from information_schema.columns where table_name='open_leads_settings' and column_name='reveal_quota_weekly') as c_quota,
  (select count(*) from public.ai_knowledge) as kb_entries,
  exists(select 1 from storage.buckets where id='avatars') as bucket_avatars;
```

Expected: `rpcs_expect_7 = 7`, all booleans `true`, `kb_entries` in the hundreds, `bucket_avatars = true` (after running 24).

---

## 3. Code ↔ database consistency (VERIFIED)

Mechanically cross-referenced every database call in `src/` and `api/` against all migrations.

- **RPCs called by the app:** `reveal_contact`, `mark_lead_open`, `assign_open_lead`, `check_duplicate_phone`, `auto_open_stale_leads` — **all defined** (migrations 12/20/22/23). ✅
- **Tables queried by the app:** all exist in migrations. `lead_reveals` and `security_alerts` are intentionally **not** queried directly — they are reached only through SECURITY DEFINER RPCs (correct, prevents data leakage). ✅
- **`avatars`** appeared as a "table" in the scan but is actually `storage.from('avatars')` — a Storage bucket. It had no migration → **Finding #2, fixed in 24**.
- **Column naming:** consistent across code and schema — `leads.project`, `assigned_agent`, `created_by`, `next_followup`, `last_contacted`, `opened_reason`, `original_agent`, `normalized_phone`, `lead_type`. The names the audit spec warned about (`project_name`, `assigned_agent_id`, `created_by_user_id`, `next_follow_up_at`, `phone_e164`, …) are **not** used on leads. `project_name` exists only on `hot_resale_deals` (its own column). **No mismatches.** ✅
- **`security_overview`** RPC is defined but not yet called — it's the Wave 2 reporting endpoint, built ahead of its UI. Not a defect.

---

## 4. Security & secrets audit (VERIFIED in code)

- **No server secret is referenced in the client bundle.** The frontend uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (both public/publishable, RLS-protected). ✅
- **Server-only secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `OTP_PEPPER`, `RESEND_FROM`, `ANTHROPIC_MODEL`) are referenced **only** in `api/` serverless functions. ✅ → You must confirm they are **set in Vercel** (checklist).
- **Agent data-theft protections** are DB-enforced (not just frontend): agents cannot delete (guard trigger on `leads.deleted`), cannot edit phone/whatsapp/name/email/source (guard trigger), and reveals are quota-limited + rate-limited via `reveal_contact` (server-side). Bulk reveal/assign/export UI is admin-only. ✅

---

## 5. RLS audit (VERIFIED in code)

RLS is enabled with policies on: `leads`, `profiles`, `lead_activity`, `lead_ownership_history`, `follow_ups`, `lead_comments`, `deals`, `deal_documents`, `hot_resale_deals`, `ai_knowledge`, `open_leads_settings`, `lead_reveals`, `security_alerts`, `notifications`, `projects`, plus storage policies for `project-files`/`deal-docs`/`avatars`.

- **Master Admin** (`saad@amberhomes.ae`): full access via `is_admin()`/`is_master()`; migration 16 self-heals the role and is distinct from any "Saad Rizwan" agent (matched by exact email). ✅
- **Agent**: own assigned/created leads + the open pool (`is_open = true`) only; protected-column writes blocked at the DB; reveals via quota RPC; one-lead-at-a-time self-assign. ✅
- **Security tables**: `security_alerts` is admin-read-only; `lead_reveals` is own/admin-read. ✅

The one thing the code can't prove is that **these migrations are applied** — §2 query confirms it.

---

## 6. Storage audit

| Bucket | Created by | Visibility | Code use | Status |
|--------|-----------|-----------|----------|--------|
| `project-files` | migration 08 | public | project attachments | ✅ migration-managed |
| `deal-docs` | migration 10 | private | deal documents (admin/owner) | ✅ migration-managed |
| `avatars` | **migration 24 (new)** | public | profile photos `{uid}/avatar.ext` | **Fixed** — run 24, then VERIFY upload |

After running 24, confirm in **Storage** that `avatars` exists and that a profile-photo upload works for an agent.

---

## 7. Known-but-deferred (not blockers)

- **Hard DB unique index on phone** is commented in migration 22 by design — it would fail if duplicates already exist. Run the duplicate-report query in 22, resolve any, then enable it. Until then, duplicates are blocked at the app + RPC layer.
- **Security Watch dashboard, Ask Amber security reports, agent Open-Leads card view, masked-number display** — Wave 2 (enforcement + data already shipped).
- **Reveal-no-action automatic alert** and **daily open-leads auto-run** need a scheduler (pg_cron or Vercel Cron). The data is captured; the periodic job is not wired.

---

## 8. Final report (A–Z)

**A. Audit summary** — Code↔DB consistency is sound; the "missed migrations" were unrun, not miswritten. One real gap (avatars bucket) fixed via migration 24. Remaining items are dashboard/runtime verifications.
**B. Missing SQL/migrations found** — 07, 16–23 written but not applied in Supabase; `avatars` bucket had no migration at all.
**C. Migrations applied** — you are running 07, 16–24 now; §2 query confirms. (01, 03–15 already applied — app runs.)
**D. Tables missing/repaired** — `ai_knowledge` (created by 07, was unrun); no other table missing. No table repair needed in code.
**E. Columns missing/repaired** — `lead_type` (20), `normalized_phone` (22), `open_leads_settings` security columns (23) — all from unrun migrations; no naming mismatches.
**F. RLS policies missing/repaired** — none missing in code; all defined. New storage policies for `avatars` added (24).
**G. Storage buckets/policies** — `avatars` bucket + 4 policies added (24). `project-files`/`deal-docs` already covered.
**H. API routes broken/fixed** — none broken in code; `api/ai.js`, `api/admin.js`, `api/auth.js` reference only server env vars (confirm set in Vercel).
**I. Frontend pages broken/fixed** — the earlier "Unable to load leads" (missing `lead_type`) was already fixed (resilient `select('*')`); no other page-level defect found in code.
**J. Master Admin verification** — enforced by migration 16 for `saad@amberhomes.ae`; `is_admin`/`is_master` correct.
**K. Agent permissions** — delete-blocked, field-locked, quota-revealed, one-at-a-time assign — DB-enforced.
**L. Leads module** — schema/code consistent; resilient loading; smart phone input + dedup live.
**M. Open Leads** — pool visible to agents; masked contact; reveal/assign/mark-open RPCs live (need migrations applied).
**N. Ask Amber** — knowledge-first ordering + lead/launch matching in code; depends on KB seeds (17/19/21) applied.
**O. AI KB / Founder's Knowledge** — tables + seeds present (07/17/19/21); copy-safe dollar-quoted versions shipped.
**P. Deals/commission** — `deals`, `deal_documents`, `hot_resale_deals` + guards/triggers defined.
**Q. Users & Agents** — profiles + admin API; ensure service role key set (perf split is a Wave-2 nicety).
**R. Storage/upload** — fixed (avatars, migration 24); verify upload post-run.
**S. Security/data-theft** — verified DB-enforced (see §4).
**T. Performance** — indexes present (15/18); leads/dash queries capped at 2000 + client filter; deeper server-side pagination is a future optimization, not a blocker.
**U. Backup/rollback** — **VERIFY** backups/PITR in dashboard before go-live (checklist) — I cannot see this.
**V. Files changed** — `supabase/24_pre_go_live_repair.sql` (new); `CRM_GO_LIVE_AUDIT_REPORT.md`, `PRODUCTION_SAFETY_CHECKLIST.md`, `PRE_GO_LIVE_SMOKE_TEST.md` (new). No app code change required by this audit.
**W. SQL migrations added** — `24_pre_go_live_repair.sql`.
**X. Build status** — no app code changed; last shipped build/eslint/probe passed.
**Y. Live URL** — https://crm.amberhomes.ai
**Z. Remaining risks** — (1) migrations must actually be applied — confirm with §2; (2) dashboard items unverifiable from here (buckets, backups, redirect URLs, Vercel env vars) — see checklist; (3) Wave-2 UI (Security Watch, Ask Amber reports) pending; (4) schedulers for auto-open / no-action alerts not wired.

---

*Generated by repository audit. Items marked VERIFY require your confirmation in the Supabase/Vercel dashboards, which are outside the code and could not be inspected automatically.*
