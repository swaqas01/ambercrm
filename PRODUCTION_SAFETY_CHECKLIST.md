# Amber Homes CRM — Production Safety Checklist

Work top to bottom before flipping the switch to "live for the team." Items marked **[dashboard]** are things only you can verify (I can't see your Supabase/Vercel dashboards).

---

## 1. Backup first (do this before running any migration)
- [ ] **[dashboard]** Supabase → Database → **Backups**: confirm daily backups are enabled.
- [ ] **[dashboard]** If your plan supports it, enable **Point-in-Time Recovery (PITR)**.
- [ ] **[dashboard]** Take a **manual backup now**: Database → Backups → *Create backup* (or download a snapshot). This is your rollback point before applying 16–24.
- [ ] Note the timestamp of the manual backup here: ____________________

## 2. Apply migrations safely
- [ ] Run migrations in order **16 → 24**, skipping **02** (sample data). Each: paste → Run → "Success".
- [ ] Use the **download cards / Copy-raw button** for the content seeds (17, 19, 21) — never hand-select code (apostrophes corrupt).
- [ ] Run the **confirmation query** from the audit report (§2). Expect `rpcs_expect_7 = 7`, all booleans `true`, `kb_entries` in the hundreds, `bucket_avatars = true`.
- [ ] **No destructive SQL** was run (these migrations only create/alter/insert — verified).

## 3. Master Admin
- [ ] **[dashboard]** Authentication → Users: `saad@amberhomes.ae` exists and is **confirmed**.
- [ ] After migration 16, run: `select email, role from public.profiles where lower(email)='saad@amberhomes.ae';` → role = `master_admin`.
- [ ] Confirm this is **not** confused with any "Saad Rizwan" agent account.

## 4. Storage
- [ ] **[dashboard]** Storage shows three buckets: `project-files` (public), `deal-docs` (private), `avatars` (public).
- [ ] Upload a profile photo as a test agent → it displays. (Confirms migration 24 + policies.)
- [ ] **[dashboard]** Confirm `deal-docs` is **private** (not public) — it holds deal documents.

## 5. Auth & domain **[dashboard]**
- [ ] Supabase → Authentication → URL Configuration → **Site URL** = `https://crm.amberhomes.ai`.
- [ ] **Redirect URLs** include: `https://crm.amberhomes.ai`, `https://crm.amberhomes.ai/*`, and your staging `https://ambercrm.vercel.app/*` if used.
- [ ] Trigger a **password reset** email → the link points to `crm.amberhomes.ai`, **not** localhost.
- [ ] Test login for: Master Admin, an Admin (if any), an Agent. No login loop.
- [ ] If 2FA/OTP is in use: confirm `OTP_PEPPER`, `RESEND_API_KEY`, `RESEND_FROM` are set (below), and an OTP email arrives.

## 6. Environment variables **[dashboard — Vercel → Settings → Environment Variables]**
Frontend (safe to be public):
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

Server-only (must **never** be exposed; set in Vercel, used by `api/`):
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Users & Agents admin actions need this)
- [ ] `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` (Ask Amber)
- [ ] `RESEND_API_KEY`, `RESEND_FROM` (email / password reset / OTP)
- [ ] `OTP_PEPPER` (2FA hashing)
- [ ] After setting/adding any var, **redeploy** so it takes effect.

## 7. Security posture (verified in code — spot-check live)
- [ ] Agent has **no Delete button** on leads; an API delete attempt is rejected.
- [ ] Agent **cannot edit** phone/WhatsApp/name/email/lead source.
- [ ] Agent **cannot** bulk-select, bulk-assign, bulk-reveal, or import.
- [ ] Reveal a contact as an agent → it's logged; quota counts down.
- [ ] Open browser devtools → Sources → search the bundle for `service_role` / `ANTHROPIC` → **no secret present** (only help text).

## 8. Data integrity
- [ ] Spot-check that **real leads** are intact (count looks right; no demo/sample names from migration 02).
- [ ] No duplicate phone numbers were created. Optionally run the duplicate-report query in migration 22.

## 9. Deploy
- [ ] **[dashboard]** Vercel shows the latest commit deployed, build succeeded.
- [ ] Hard-refresh `crm.amberhomes.ai` (or reinstall the PWA) to pick up the latest bundle.
- [ ] Browser console is clean on load (no red errors) for Master Admin and Agent.

---

## Emergency rollback
1. **Bad data / accidental change:** restore from the manual backup taken in step 1 (Supabase → Backups → Restore), or use PITR to the timestamp before the change.
2. **Bad deploy:** Vercel → Deployments → find the previous good deployment → **Promote to Production** (instant rollback; no DB change).
3. **A specific migration caused an issue:** these migrations are additive and idempotent — they don't delete data, so a "rollback" is usually restoring the pre-migration backup rather than reversing SQL. If a single new object is problematic, drop just that object (e.g. `drop policy …`, `drop function …`) — never `drop table` on a table holding real data.
4. **Master Admin lockout:** re-run migration 16, or in SQL Editor: `update public.profiles set role='master_admin', active=true where lower(email)='saad@amberhomes.ae';`

## Golden rules
- Never run `drop table`, `truncate`, or `delete from` on `leads`/`profiles`/activity tables in production.
- Never paste SQL from a source other than these migration files.
- Always take a manual backup before a schema change.
- Test every change as **both** Master Admin and Agent before calling it done.
