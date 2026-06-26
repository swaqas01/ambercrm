# Amber Homes CRM — Security System

This document describes the permanent, layered defense protecting client data in
the Ask Amber CRM, how to run it, and the handful of things only a human can check.

> **Honest scope.** No system is "unbreachable," and nobody can promise that. What
> this system does is make the *specific failure that caused the June 2026 exposure*
> — private data readable without a login — **structurally hard to reintroduce and
> impossible to ship silently.** It catches that class of mistake automatically,
> continuously, and loudly. It is not a substitute for good operational habits
> (see "Human-only checks" below).

---

## The layers

**Layer 1 — Per-agent Row-Level Security (already in place).**
Every sensitive table has RLS enabled with policies that scope rows to the
assigned agent, with admin/master overrides. This is the primary control.

**Layer 2 — No anonymous access (migrations 49 + 50).**
- `49` revoked the anonymous role's access on the 10 tables that were exposed.
- `50` stops the root cause permanently: any table created in future starts with
  **no** anonymous access by default, and the anon role can't create objects.
  This means a new table can never silently inherit public read access again.

**Layer 3 — The scanner (`scripts/security-check.mjs`).**
Simulates an anonymous attacker on every run and fails if any private data is
reachable. See "Running the scanner."

**Layer 4 — Continuous automation (GitHub Actions).**
The scanner runs on every push, every pull request, and once a day — so drift
(e.g. a dashboard setting flipped, a policy edited) is caught within 24 hours.

**Layer 5 — Database self-audit (`security_self_audit()`).**
A read-only, master-admin-only function that lists any anon-reachable table and
any table with RLS off. Run it in the SQL editor anytime:
```sql
select * from public.security_self_audit();
-- healthy result: a single row →  overall | OK | ...
```

---

## Running the scanner

The scanner needs a network route to Supabase, so run it **from your machine** or
let **GitHub Actions** run it — not from a restricted sandbox.

```bash
npm install
npm run build          # so the bundle can be scanned for leaked keys
npm run security-check # runs the full attacker simulation
```

Exit codes: `0` = all clear · `1` = a real security failure (do not deploy) ·
`2` = could not verify (no network to Supabase — run it somewhere that can reach it).

What it checks:
1. **Anonymous read** — every sensitive table must return no rows to a logged-out request.
2. **Anonymous write** — forged inserts must be rejected.
3. **Public signup** — stranger registration must be disabled.
4. **Bundle hygiene** — no service-role key/JWT in the built frontend.
5. **Security headers** — CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, clickjacking protection.

> It will **not** call anything "safe" unless the request actually reached
> Supabase. A blocked/again-network-errored probe is reported as an ERROR, never a pass.

**When you add a new table that holds private data, add its name to
`SENSITIVE_TABLES` in `scripts/security-check.mjs`.** That one habit keeps the
scanner honest.

---

## Installing the automation (one-time, by you)

Your deploy token can't push workflow files, so add it through GitHub's web UI:
GitHub → repo → **Add file → Create new file** → name it exactly
`.github/workflows/security.yml` → paste the contents of
`SECURITY_workflow_to_paste_into_github.yml` → commit.

To make a failing scan actually *block* a merge: repo → Settings → Branches →
add a branch protection rule on `main` → require the "Security Scan" check to pass.

---

## Human-only checks (the system can't do these for you)

- **Disable public signup** — Supabase → Authentication → Sign-In/Providers →
  Email → turn off "Allow new users to sign up." (The scanner *detects* this, but
  only you can flip it.)
- **Storage buckets** — confirm `deal-docs` and `project-files` are **Private**
  and served via signed URLs if they hold client documents.
- **Infrastructure 2FA** — GitHub, Vercel, and Supabase dashboard logins bypass
  every control above. Protect them with 2FA and unique passwords.
- **Dependency patches** — run `npm audit` and patch criticals.
- **Offboarding** — deactivate an account the moment a person leaves; review the
  activity log periodically for bulk-access patterns.
- **Access-log review** — after the June exposure, review Supabase/Vercel logs for
  anomalous anonymous or high-volume access to inform any PDPL/GDPR obligations
  (a legal question — get advice).

---

## Incident history

**2026-06-26 — Anonymous data exposure (resolved).** Ten tables (incl. `leads`)
were readable by anonymous callers. Root cause: SELECT policies targeting the
`public` role with an ungated branch (e.g. `is_open = true`) intended for
logged-in agents but reachable by anyone. RLS was *enabled* throughout — this was
a permissive-policy issue, not disabled RLS. Fixed by migration 49 (revoke anon)
and 50 (permanent default-deny + self-audit), plus this scanner to prevent
recurrence. Retest of anonymous access to be confirmed externally.
