#!/usr/bin/env node
/**
 * Amber Homes CRM — STORAGE export (secondary backup, Layer 3).
 *
 * Downloads every object from each Storage bucket to disk, with a manifest.
 *
 * SECURITY: reads the SERVICE-ROLE key from an ENV VAR. Output contains private client documents —
 * store ENCRYPTED and PRIVATE, never commit.
 *
 * Usage:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/backups/backup-storage.mjs [outputDir]
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("ERROR: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUT = join(process.argv[2] || "./storage-backup", "storage-" + stamp);
mkdirSync(OUT, { recursive: true });

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const BUCKETS = ["avatars", "project-files", "deal-docs"];
const LIMIT = 100;

// Recursively list every file path in a bucket (folders have id === null in Supabase Storage).
async function listAll(bucket, prefix = "") {
  let paths = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: LIMIT, offset });
    if (error) { console.error("  list " + bucket + "/" + prefix + ": " + error.message); break; }
    for (const item of data || []) {
      const path = prefix ? prefix + "/" + item.name : item.name;
      if (item.id === null) paths = paths.concat(await listAll(bucket, path)); // folder
      else paths.push(path);
    }
    if (!data || data.length < LIMIT) break;
    offset += LIMIT;
  }
  return paths;
}

const manifest = { created_at: new Date().toISOString(), source: SUPABASE_URL, buckets: {} };
for (const bucket of BUCKETS) {
  console.log("Bucket: " + bucket);
  const paths = await listAll(bucket);
  manifest.buckets[bucket] = paths.length;
  for (const p of paths) {
    const { data, error } = await supabase.storage.from(bucket).download(p);
    if (error) { console.error("  " + bucket + "/" + p + ": " + error.message); continue; }
    const buf = Buffer.from(await data.arrayBuffer());
    const dest = join(OUT, bucket, p);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log("  " + bucket + "/" + p + " (" + buf.length + " bytes)");
  }
}
writeFileSync(join(OUT, "storage-manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Done -> " + OUT);
console.log("REMINDER: private/encrypted destination only. NEVER commit. (deal-docs is private client data.)");
