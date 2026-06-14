# Amber Homes CRM — Backup & Restore Plan

**Date:** 14 Jun 2026 · **Production:** https://crm.amberhomes.ai · **Repo:** `github.com/swaqas01/ambercrm`

This document answers, exactly: where every piece of CRM data lives, what is backed up today, what cannot be verified from code, and how to add a secure secondary backup. Items marked **[dashboard]** can only be confirmed by you in Supabase/Vercel — I have no access to them and will not claim otherwise.

---

## 1. Where all CRM data is stored

There are **four** places data lives. Nothing else.

| Store | What it holds | Provider |
|-------|---------------|----------|
| **Supabase Postgres** | All structured data — every table below | Supabase (managed Postgres) |
| **Supabase Storage** | All uploaded files — 3 buckets | Supabase Storage (S3-backed) |
| **GitHub** | All source code, design/components, SQL migrations | `swaqas01/ambercrm` |
| **Vercel** | The running website + deployment history + server env vars | Vercel |

### 1a. Database tables (Supabase Postgres) — all RLS-enabled

**Leads & activity**
- `leads` — the core record. Columns include: `id, lead_code, lead_no, client_name, phone, normalized_phone, whatsapp, email, lead_type, area, project, developer, property_type, ready_offplan, finance, timeline, budget, purpose, nationality, country_residence, language, source, status, temperature, assigned_agent, assigned_agent_name, current_owner, original_agent, created_by, is_open, opened_at, opened_by, opened_reason, opened_auto, last_contacted, next_followup, deal_value, commission_value, deleted, created_at, updated_at, created_on`. RLS: agents see own + open pool; admins see all.
- `lead_activity` — lead history / timeline: views, **contact reveals** (`reveal_phone`), **calls** (`call`), **WhatsApp** (`whatsapp`), status/field changes, notes, assignments, mark-open. RLS on.
- `lead_comments` — comments. `lead_ownership_history` — reassignment/open trail. `follow_ups` — scheduled follow-ups.
- `lead_reveals` — **contact-reveal log** for quota + theft detection (agent_id, lead_id, context, revealed_at). RLS: own/admin.
- Duplicate checks are computed live against `normalized_phone` via the `check_duplicate_phone` RPC — no separate table.
- Open-leads state lives **on the leads row** (`is_open`, `opened_*`), not a separate table.

**Users / auth**
- `profiles` — users/agents: `id, email, full_name, role, active, avatar_url, created_at` (+ phone/perf columns from later migrations). RLS on. Auth identities live in Supabase **`auth.users`** (managed).
- `auth_otp`, `auth_logs` — 2FA/OTP. RLS on.

**Projects**
- `projects`, `project_files` (metadata), `file_downloads`. Project images/documents are **files in Storage** (bucket `project-files`), referenced by URL.

**AI**
- `ai_knowledge` — **AI Knowledge Base + Founder's Knowledge** (Founder's entries are category `Founder's Knowledge`/launch focus within this table). `ai_logs` — Ask Amber logs. `ai_sources` — approved web sources. `ai_web_log` / project research cache. **No vector/embeddings store** — Ask Amber uses keyword retrieval over `ai_knowledge`, not embeddings.

**Deals**
- `deals`, `deal_activity`, `deal_documents` (metadata; files in `deal-docs` bucket), `hot_resale_deals`. Commissions are columns on `deals`/`leads` (`deal_value`, `commission_value`), not a separate table.

**Security & settings**
- `security_alerts` (suspicious-reveal alerts, admin-only), `admin_audit` (audit log), `app_settings`, `open_leads_settings` (quota/threshold/security config), `notifications`.

### 1b. Files (Supabase Storage buckets)

| Bucket | Visibility | Holds | Created by |
|--------|-----------|-------|-----------|
| `avatars` | public | profile photos (`{uid}/avatar.ext`) | migration 24 |
| `project-files` | public | project images/documents | migration 08 |
| `deal-docs` | **private** | deal documents (admin/owner only) | migration 10 |

App icon / PWA manifest / icons are **static assets in the GitHub repo** (`/public`), shipped by Vercel — not in Storage. Imported lead files (CSV/XLSX) are parsed in the browser and **not stored** — only the resulting rows go into `leads`.

### 1c. Website / code / design

- **Code + design/components:** all in GitHub `swaqas01/ambercrm` (single React/Vite app, `src/App.jsx` etc.). Migrations in `supabase/`. ✅ backed up by virtue of being in Git.
- **Live deployment:** Vercel (auto-builds on push to `main`). Domain `crm.amberhomes.ai` → Vercel; DNS at GoDaddy.
- **Environment variables:** stored in **Vercel** (server) — names documented in the safety checklist; secret **values are not committed** (correct). Frontend uses only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- **Deployment history / rollback:** Vercel keeps prior deployments — any can be promoted to production instantly. ✅

---

## 2. What is backed up right now (honest status)

| Item | Status |
|------|--------|
| Source code, design, migrations | ✅ **Backed up** in GitHub (full history). |
| Vercel deployment history | ✅ Available — instant rollback to a previous deploy. |
| Env var **values** | ⚠️ Stored only in Vercel. **Not** independently backed up. Keep a copy in a password manager (see §3 Layer 4). |
| Supabase **database** automated backups | **[dashboard] Cannot verify from code.** Needs Supabase → Database → Backups confirmation. (Pro plan = daily; PITR if enabled.) |
| Point-in-time recovery (PITR) | **[dashboard] Cannot verify from code.** |
| Backup retention (days) | **[dashboard] Cannot verify from code.** |
| Supabase **Storage files** backup | ⚠️ Supabase does **not** back up Storage objects the same way as the DB on all plans. **Treat as not separately backed up** until Layer 3 below is set up. |
| Secondary off-Supabase backup | ❌ **Does not exist yet** — this plan creates it. |
| Migration files in repo | ✅ All 24 in `supabase/`. |

**Cannot verify from code → needs Supabase/Vercel dashboard confirmation:** DB backup enabled, PITR enabled, backup frequency, retention days, Storage backup. Confirm these in the dashboard and write the answers into the safety checklist.

---

## 3. Secondary backup plan (5 layers)

### Layer 1 — Supabase native (enable + confirm) **[dashboard]**
- Confirm **daily backups** are on (Supabase → Database → Backups).
- Enable **PITR** if your plan supports it (lets you restore to any second within the window).
- Take a **manual backup before every schema change or deploy involving SQL**.

### Layer 2 — Scheduled database export (off Supabase)
- Use `/scripts/backups/backup-database.mjs` (in this repo). It connects with the **service-role key from an env var** (never committed) and writes, per run:
  - a per-table **JSON** file for every core table, and **CSV** for the big ones (`leads`, `lead_activity`, `deals`),
  - a `backup-manifest.json` (row counts, timestamp, checksums).
- **Schedule:** daily full export. Optionally hourly for `leads`+`lead_activity`+`deals`. Weekly archive kept 8–12 weeks.
- **Run it from one of:** a GitHub Action (example workflow provided), a small cron box, or your laptop. Output goes to an **encrypted private** destination (S3/R2/GCS), **never** to the repo.

### Layer 3 — Storage backup (off Supabase)
- Use `/scripts/backups/backup-storage.mjs` to download every object from `avatars`, `project-files`, `deal-docs` and re-upload to a second bucket (another Supabase project, AWS S3, Cloudflare R2, or GCS). Keep the destination **private**.
- **Schedule:** daily or weekly (files change less often than rows).

### Layer 4 — Code / design / environment
- ✅ Code, design, migrations already in GitHub — keep `main` protected.
- Store **env var values** in a password manager (1Password/Bitwarden) labelled "Amber CRM — Vercel prod". The repo only documents the **names**.
- Vercel deployment history covers app rollback.

### Layer 5 — In-app Master-Admin export (added this update)
- A **Master-Admin-only** "Backup / Export" panel in the app downloads CSV/JSON of the core tables directly from the browser, and **logs every export** to `admin_audit`. Agents have **no** access. Use it for an instant manual snapshot without running scripts. (Details in the audit report.)

---

## 4. How to restore (by scenario)

1. **App/UI breaks after a deploy:** Vercel → Deployments → pick the last good one → **Promote to Production**. No database change. (~30 seconds.)
2. **Database corrupted / bad data:** Supabase → Database → Backups → **Restore** the most recent good backup, or use **PITR** to a timestamp before the incident. If you only have a Layer-2 export, create a fresh Supabase project and import the JSON/CSV with `restore-instructions.md`.
3. **Files lost (Storage):** re-upload from the Layer-3 copy with `backup-storage.mjs` in reverse (documented), or restore the second bucket.
4. **Vercel project lost:** re-import the GitHub repo into a new Vercel project, set the env vars from your password manager, point the domain. Code is intact in Git.
5. **Total Supabase loss:** new Supabase project → run migrations `01,03–24` (skip 02) → import Layer-2 DB export → restore Layer-3 Storage → update `VITE_SUPABASE_URL`/`ANON_KEY` + server keys in Vercel → redeploy.

---

## 5. Backup security rules
- Backups contain **private client data** → store only in **encrypted/private** locations. **Never commit a backup to GitHub.**
- No backup link publicly accessible. Backup access = **Master Admin / technical admin only**.
- Service-role key is **server-only** (used by scripts via env var, never in the frontend, never committed).
- Export/backup actions are **audit-logged**; logs avoid dumping full phone/email where possible.
- **Retention:** daily kept 14 days, weekly kept 8–12 weeks; rotate/delete older securely.

---

## 6. Data-loss-prevention rules (production)
- No destructive migration without a fresh backup. **No `DROP`/`TRUNCATE`/`DELETE`** on `leads`/`profiles`/activity tables in production.
- No mass `UPDATE` without a `WHERE` and a backup. Prefer **soft delete** (`deleted = true`).
- Audit every sensitive action. Test migrations on staging first. **Take a backup before every SQL deploy.** Keep every migration in the repo and verify it applied (confirmation query in the audit report).

---

## 7. Required answers (the 15 questions)
1. **Lead data:** Supabase Postgres — `leads` (+ `lead_activity`, `lead_comments`, `follow_ups`, `lead_reveals`, `lead_ownership_history`). RLS on.
2. **Website/code/design:** GitHub `swaqas01/ambercrm`; deployed on Vercel.
3. **Project uploads:** Storage bucket `project-files`; metadata in `projects`/`project_files`.
4. **AI Knowledge Base:** `ai_knowledge` table (no embeddings; keyword retrieval).
5. **Founder's Knowledge:** same `ai_knowledge` table, category `Founder's Knowledge`/launch-focus.
6. **Files/documents:** Storage buckets `avatars` (public), `project-files` (public), `deal-docs` (private).
7. **Backed up now:** code/migrations (GitHub) ✅; Vercel deploy history ✅. DB/PITR/Storage backups = dashboard-verify.
8. **Not backed up / unverifiable:** secondary off-Supabase backup (created here) ❌; Storage backup ⚠️; env-var values ⚠️; Supabase DB backup/PITR/retention = **[dashboard]**.
9. **Restore if CRM (app) breaks:** Vercel promote previous deployment.
10. **Restore if Supabase data corrupted:** Supabase Restore / PITR, else import Layer-2 export.
11. **Restore if files lost:** Layer-3 Storage copy.
12. **Restore if Vercel breaks:** re-import GitHub repo, set env vars, repoint domain.
13. **Secondary backup system:** Layers 2–3 scripts → encrypted S3/R2/GCS or a second Supabase project, on a schedule.
14. **Enable in dashboard:** Supabase daily backups + PITR + retention; confirm Storage backup; store env-var values in a password manager.
15. **Scripts/docs created:** `BACKUP_AND_RESTORE_PLAN.md`, `/scripts/backups/{backup-database.mjs, backup-storage.mjs, restore-instructions.md, backup-manifest-template.json, github-action.yml, README.md}`, plus the in-app Master-Admin export.

---

*Items marked [dashboard] require your confirmation in Supabase/Vercel and could not be verified from code.*
