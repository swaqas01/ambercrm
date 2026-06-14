# Amber Homes CRM — Backup scripts

Secondary backup for the CRM. See `BACKUP_AND_RESTORE_PLAN.md` (repo root) for the full plan.

## What's here
- `backup-database.mjs` — exports every core table to JSON (+CSV for leads/lead_activity/deals) + manifest.
- `backup-storage.mjs` — downloads every file from the `avatars`, `project-files`, `deal-docs` buckets + manifest.
- `restore-instructions.md` — how to restore database, storage, code, environment.
- `backup-manifest-template.json` — shape of the manifest the scripts produce.
- `github-action.yml` — example nightly workflow (private repo only).

## Run locally
```bash
npm i @supabase/supabase-js
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # SERVER-ONLY secret — never commit
node scripts/backups/backup-database.mjs ./backup-output
node scripts/backups/backup-storage.mjs   ./backup-output
```

## Hard rules
- The service-role key is **server-only**. Never put it in the frontend or commit it.
- Backup output contains **private client data**. Store ENCRYPTED + PRIVATE (S3 with SSE, R2, GCS, or an encrypted disk). **Never commit it.**
- Keep daily backups 14 days, weekly 8–12 weeks; rotate older securely.
