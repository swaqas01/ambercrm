# Amber Homes CRM — Restore Instructions

## A. Restore the database (Supabase)
**Preferred:** Supabase -> Database -> Backups -> Restore the latest good backup, or use PITR to a timestamp before the incident.

**From a Layer-2 export (JSON/CSV):**
1. Create/choose a target Supabase project. Run migrations `01,03–24` (skip 02) in order so the schema exists.
2. For each `*.json` in the backup, insert rows back. Easiest: a small Node script using the service-role key:
   ```js
   import { createClient } from "@supabase/supabase-js";
   import { readFileSync, readdirSync } from "node:fs";
   const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
   for (const f of readdirSync("./db-export").filter(f=>f.endsWith(".json"))) {
     const table = f.replace(".json","");
     const rows = JSON.parse(readFileSync("./db-export/"+f,"utf8"));
     for (let i=0;i<rows.length;i+=500){
       const { error } = await sb.from(table).upsert(rows.slice(i,i+500), { onConflict:"id" });
       if (error) console.error(table, error.message);
     }
   }
   ```
   Restore order to respect foreign keys: `profiles` -> `leads` -> everything else.
3. Verify row counts against `backup-manifest.json`.

## B. Restore storage files
Re-upload from the Layer-3 copy:
```js
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
function walk(d){ return readdirSync(d).flatMap(n=>{const p=join(d,n); return statSync(p).isDirectory()?walk(p):[p];}); }
for (const bucket of ["avatars","project-files","deal-docs"]) {
  for (const p of walk("./storage-backup/"+bucket)) {
    const key = relative("./storage-backup/"+bucket, p);
    const { error } = await sb.storage.from(bucket).upload(key, readFileSync(p), { upsert:true });
    if (error) console.error(bucket, key, error.message);
  }
}
```
(Recreate the buckets first by running migrations 08/10/24 if the project is new.)

## C. Restore the code / app
GitHub holds all code + migrations. Re-import `swaqas01/ambercrm` into Vercel if needed.

## D. Restore the environment
Set Vercel env vars from your password manager: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `RESEND_API_KEY`, `RESEND_FROM`, `OTP_PEPPER`. Redeploy.

## E. Total loss runbook
New Supabase project -> run migrations (01,03–24, skip 02) -> restore DB (A) -> restore storage (B) ->
update Vercel env (D) -> redeploy -> run the confirmation query from the audit report -> smoke test.
