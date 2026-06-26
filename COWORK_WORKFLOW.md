# Cowork Deploy Workflow (Ask Amber CRM)

Source of truth: this GitHub repo. Vercel auto-deploys on push to `main` (~1 min).

How changes ship now:
1. Pull latest from GitHub.
2. Edit code (app is a single `src/App.jsx`).
3. Push to `main` -> Vercel deploys automatically.
4. DB changes: numbered SQL migration in `supabase/`, run by Saad in the Supabase SQL editor.

This file confirms the automated push pipeline is live.
