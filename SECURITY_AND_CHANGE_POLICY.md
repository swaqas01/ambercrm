# Amber Homes CRM — Security & Change Safety Policy

**Status: LIVE PRODUCTION SOFTWARE.** Used daily by all agents. Treat every change as an
upgrade to a running system, never a rebuild. When in doubt, do less.

Production: https://crm.amberhomes.ai
Stack: React + Vite (Vercel) · Supabase (Postgres + Auth + RLS) · serverless API in `/api`

---

## 1. Hard rules (never violate)

- **Do NOT reset or drop the database**, or any production table, without explicit Master-Admin approval.
- **Do NOT delete production data.** No `DELETE`/`TRUNCATE`/`DROP` on live tables in a normal change.
- **Do NOT weaken or disable RLS.** All sensitive tables must keep Row-Level Security enabled.
- **Do NOT expose service-role keys, API keys, or email keys** to the browser bundle or the repo.
  Server-only secrets live in Vercel env vars and are used only in `/api/*`.
- **Do NOT rewrite working core modules** (list below) to "clean them up." Incremental edits only.
- **Do NOT remove existing functionality** or break saved workflows to ship something new.
- **Do NOT make fundamental auth/architecture changes** without approval.
- **No fake/seed data** in production.

## 2. Core modules that must stay intact

Authentication · 2FA (email OTP) · trusted 7-day sessions · 3-device limit · roles & permissions ·
RLS policies · leads · Open Leads · lead reveal/contact security · call/WhatsApp/reveal logs ·
follow-ups · comments · deals · commissions · dashboards · agent performance · attendance ·
targets · Ask Amber · project/hot-listing modules · PWA/mobile behavior.

## 3. Mandatory pre-deploy checklist (every change)

1. Inspect the current working behavior of the area you're touching.
2. Make the **smallest** change that solves the problem. Touch nothing unrelated.
3. `npm run build` must succeed.
4. ESLint must pass (0 errors).
5. Run the headless render probe (loaded-out app boots, no console errors).
6. For `/api/*.js`: `node --check`. For SQL migrations: validate parse (`pglast`) and confirm non-destructive.
7. Confirm no RLS/role/security regression in the touched area.
8. Bump the service-worker cache version **only** when client code (App/main/sw) changed.
9. Keep the previous commit as the rollback point. Never force-push over history.
10. Record: files changed + risk level (below) in the commit/PR notes.

## 4. Risk classification

- **Low** — UI placement, copy, documentation. (e.g. moving a pagination footer.)
- **Medium** — query optimization, added logging, new read-only diagnostics, additive indexes.
- **High** — anything touching auth, sessions, RLS, schema changes, role checks, secrets, or
  the reveal/contact-masking path. High-risk changes require approval and a stated rollback plan
  *before* applying.

## 5. Database & migration rules

- Migrations must be **additive and idempotent** by default (`IF NOT EXISTS`, `CREATE OR REPLACE`,
  guarded `ALTER ... ADD COLUMN IF NOT EXISTS`).
- A migration that drops/renames/changes the type of a production column, or removes an index,
  is **High risk** and needs explicit approval.
- **Import scripts are one-time and controlled.** After a bulk import completes, drop any staging
  table (staging tables lack RLS and are API-exposed). Never leave an import endpoint live.
- Every new table that holds user/lead data must have RLS enabled with correct policies before
  it is used by the app.

## 6. API & secrets rules

- Every authenticated route validates the caller's session server-side. Role checks are enforced
  on the server/RLS, **not** by hiding UI.
- The AI endpoint (Ask Amber) is authenticated and must respect CRM permissions — it must not load
  unauthorized rows into context.
- Cron/maintenance endpoints must be protected (secret/cron auth), never publicly triggerable.
- Secrets (Supabase service-role, Anthropic, Resend) are **server-only**. The browser bundle may
  contain only the Supabase publishable/anon key (safe; gated by RLS).
- No secret values committed to the repo. No debug route prints secrets.

## 7. Contact-reveal security (do not regress)

- Open Leads contact details are masked until an explicit per-lead, per-user reveal.
- Revealing one lead must not unmask the next lead.
- Reveal / call / WhatsApp actions are logged to the activity log.

## 8. Performance guardrails

- Leads and Open Leads stay **server-side paginated** — list views never fetch all rows.
- Dashboard counts use aggregate/`head:true` count queries, not full row pulls.
- Don't remove existing indexes. New heavy queries need an index and review.

---

*This file is a guardrail for any developer or AI assistant working on the CRM. If a requested
change conflicts with these rules, stop and confirm with the Master Admin before proceeding.*
