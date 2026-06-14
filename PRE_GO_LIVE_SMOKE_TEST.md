# Amber Homes CRM — Pre-Go-Live Smoke Test

Run this end-to-end after migrations 16–24 are applied and the latest build is deployed. You need two browser sessions: one as **Master Admin** (`saad@amberhomes.ae`) and one as a **test Agent**. Tick each box; if any fails, note it and stop on that area.

> Tip: keep the test Agent account around permanently for QA so you can always test agent-side behaviour without touching real agents.

---

## A. Auth
- [ ] Master Admin login works; lands on the admin dashboard.
- [ ] Agent login works; lands on the agent dashboard.
- [ ] Logout works for both; re-login works; no login loop.
- [ ] Password reset email arrives and its link opens `crm.amberhomes.ai` (not localhost).

## B. Leads — Master Admin
- [ ] **Leads** loads (no "Unable to load leads"); shows assigned + unassigned + open.
- [ ] Filters work: lead type, area, agent, status, temperature, date.
- [ ] Search works; sorting works.
- [ ] Open a lead → Lead Detail loads → back to list → list still loads.
- [ ] **Add Lead**: smart phone input shows UAE/Saudi/UK/Pakistan/India/Russia pinned, rest alphabetical, searchable.
- [ ] Type `0506271369` with UAE selected → saves as `+971506271369`.
- [ ] "WhatsApp same as phone" checked by default; unchecking reveals a second number field.
- [ ] **Edit Lead**: change Lead Type → it saves. Edit phone via smart input → saves.
- [ ] **Duplicate (admin)**: add a lead with an existing phone → blocked with existing client/agent/status + **Open Existing Lead**.

## C. Leads — Agent
- [ ] **My Leads** loads; shows only this agent's leads (no other agents' private leads).
- [ ] **Add Lead** works for the agent.
- [ ] **No Delete button** anywhere on a lead.
- [ ] Phone/WhatsApp/name/email are **read-only** (locked) in Lead Detail.
- [ ] **Duplicate (agent, own)** → "This lead already exists in your leads." + Open Lead.
- [ ] **Duplicate (agent, another agent's number)** → "This lead already exists in the CRM. Please speak to your manager." (no details shown).
- [ ] **Call** link is `tel:+971…` (keeps the plus); **WhatsApp** opens `wa.me/971…`.

## D. Open Leads (Agent)
- [ ] Agent sees the **Open Leads** list (the pool).
- [ ] Contact shortcuts in the list are **masked** ("Reveal inside") for open leads.
- [ ] Open an open lead → **Reveal Contact** → number appears; reveal is logged.
- [ ] **Call/WhatsApp** only appear after reveal for an open lead the agent doesn't own.
- [ ] **Assign to Me** → lead becomes the agent's, leaves the open pool, appears in My Leads.
- [ ] On the agent's own active lead → **Mark as Open** → pick a reason → it moves to the pool.
- [ ] No bulk select / bulk actions anywhere for the agent.

## E. Reveal quota & security (Agent)
- [ ] After a normal reveal, no error; (optionally) a "X reveals left this week" note under 20 remaining.
- [ ] (If you can simulate) hitting the weekly limit shows: "You have reached your weekly contact reveal limit. Please speak to your manager."
- [ ] Check `select * from public.security_alerts order by created_at desc limit 5;` after heavy testing — alerts appear for rapid reveals.

## F. Ask Amber
- [ ] Ask a general question → answers; markdown renders (bold/lists), **no raw `**` or `#` showing**.
- [ ] Agent: "show me my latest lead" → returns a lead card for **their** lead only.
- [ ] Master Admin: ask for an agent/report → returns data (admin scope).
- [ ] Ask about an upcoming launch → launch-focus content appears (KB seeds applied).

## G. Knowledge base
- [ ] `select count(*) from public.ai_knowledge;` → a few hundred entries.
- [ ] Founder's Knowledge entries are present and visible to Ask Amber.
- [ ] Master Admin can create/edit a Founder's Knowledge entry.

## H. Deals & commission
- [ ] **Close deal** submission works from a lead.
- [ ] Deal document upload works (`deal-docs` bucket).
- [ ] Admin approval flow works; commission figures are non-zero when a commission exists.
- [ ] Monthly/quarterly/yearly totals look correct (no demo numbers).

## I. Users & Agents
- [ ] **Users & Agents** loads (needs `SUPABASE_SERVICE_ROLE_KEY` set in Vercel).
- [ ] Roles, active/inactive, last login show correctly.
- [ ] `saad@amberhomes.ae` = Master Admin; no accidental master-admin on other accounts.

## J. Storage / profile photo
- [ ] Agent uploads a profile photo → it displays (confirms `avatars` bucket + migration 24).
- [ ] An agent **cannot** read another user's private deal document.

## K. Dashboards
- [ ] Master Admin: lead counts, unassigned count, conversion, commission totals, agent activity — all real numbers.
- [ ] Agent: own performance, calls, WhatsApp, follow-ups, closed value, commission — only their data.

## L. Mobile / PWA
- [ ] App opens on phone; icons/manifest load.
- [ ] Smart phone input and Open Leads work on a narrow screen.
- [ ] iOS safe-area looks correct (no content under the notch).

## M. Build / deploy
- [ ] Vercel shows the latest deploy succeeded.
- [ ] Browser console clean on load for Master Admin and Agent.
- [ ] Hard refresh / PWA reinstall picks up the latest version.

---

**Sign-off:** Master Admin ____  Agent ____  Date ____
If every box is ticked, the CRM is go-live ready. Record any failures with the page name and the exact error, and address them before launch.
