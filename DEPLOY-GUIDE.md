# Make Amber Lead Desk Live — Beginner's Guide
### Zero experience needed · ~30 minutes · everything is free except AI usage

You will use two websites: **GitHub** (stores your code) and **Vercel** (puts it on the internet). No command line, no coding.

---

## Part 1 — Put the code on GitHub (10 min)

1. Go to **github.com** → Sign up (free) if you don't have an account.
2. Top-right **+** → **New repository**.
3. Name: `amber-lead-desk` → set it to **Private** → click **Create repository**.
4. On the new repo page, click the link **"uploading an existing file."**
5. Unzip `amber-lead-desk-deploy.zip` on your computer. Drag **everything inside the folder** (the `src` folder, `api` folder, `package.json`, `index.html`, `vite.config.js`) into the GitHub upload box.
   ⚠️ Drag the *contents*, not the outer folder itself.
6. Click **Commit changes**. Done — your code is stored.

## Part 2 — Deploy on Vercel (10 min)

1. Go to **vercel.com** → **Sign up** → choose **Continue with GitHub** (this links the two automatically).
2. Click **Add New… → Project**.
3. You'll see `amber-lead-desk` in the list → click **Import**.
4. Vercel auto-detects everything (it will say *Framework: Vite*). Don't change anything yet — first do Part 3 below on this same screen, then press **Deploy**.
5. Wait ~1 minute. You'll get a live URL like `amber-lead-desk.vercel.app`. **Your CRM is on the internet.** Open it on your phone — it works.

## Part 3 — Connect the AI (your Anthropic key) (10 min)

1. In another tab go to **console.anthropic.com** → sign up → add a payment method under **Billing** (AI is pay-per-use; set a monthly **spend limit**, e.g. $25, on the same page).
2. Go to **API Keys** → **Create Key** → name it `amber-crm` → copy the key (starts with `sk-ant-…`). You'll only see it once — paste it somewhere safe.
3. Back in Vercel, on the Import screen (or later under **Project → Settings → Environment Variables**):
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** paste your key
   - Click **Add**, then **Deploy** (or **Redeploy** if already deployed).
4. Open your live URL → tap the gold **Desk AI** button → ask *"show me Derya's performance."* If it answers, everything is connected.

🔒 **Why this is safe:** your key lives only in Vercel's environment settings. Visitors' browsers call your own `/api/ai` address; the key is attached on the server. Nobody can view-source and steal it.

## Part 4 — Your own domain (optional, 5 min)

Vercel project → **Settings → Domains** → add `crm.amberhomes.ae` → it shows you one DNS record (a CNAME) → add that record wherever amberhomes.ae is managed (GoDaddy/Cloudflare/etc.) → SSL (the padlock) is automatic.

## Part 5 — Agents on phones (2 min each)

Send agents the link. iPhone: Safari → Share → **Add to Home Screen**. Android: Chrome → menu → **Add to Home screen**. It now opens like an app.

---

## Updating later
Edit or replace files in GitHub (the website has an edit button on every file) → commit → Vercel redeploys automatically in ~1 minute. That's the whole maintenance story.

## What this deployment is — and isn't (important)
This puts the **clickable prototype + working AI chat** live: perfect for demos, agent previews, and investor/developer walkthroughs. It is **not yet the secure multi-user CRM** — the data is sample data, logins are demonstrations, and nothing is stored in a database. The real build (Postgres + RLS, real auth, audit logs — everything in the plan document) is the developer project; when it's built, it deploys to this exact same Vercel setup, so nothing you do today is wasted.

## If something breaks
- Build fails on Vercel → you probably uploaded the outer folder; repo root must directly contain `package.json`.
- AI says it can't connect → Environment Variable name must be exactly `ANTHROPIC_API_KEY`, then **Redeploy**.
- AI worked then stopped → check your Anthropic spend limit hasn't been hit.
