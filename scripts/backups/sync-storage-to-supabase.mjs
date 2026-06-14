#!/usr/bin/env node
/**
 * Amber Homes CRM — STORAGE replication to a SECOND Supabase project (secondary backup, Layer 3).
 *
 * Copies every file from the live project's buckets (avatars, project-files, deal-docs) into a
 * separate "backup" Supabase project. Supabase's own database backups do NOT include Storage files,
 * so this is what protects deal documents, project images, and profile photos.
 *
 * SECURITY: every key is read from an ENV VAR. Service-role keys are SERVER-ONLY — never commit them.
 *
 * Required env vars:
 *   SOURCE_SUPABASE_URL        e.g. https://fkeniejcitwlqfatkopi.supabase.co   (your LIVE project)
 *   SOURCE_SERVICE_ROLE_KEY    service_role key of the LIVE project
 *   DEST_SUPABASE_URL          URL of the BACKUP project
 *   DEST_SERVICE_ROLE_KEY      service_role key of the BACKUP project
 *
 * Usage: node scripts/backups/sync-storage-to-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";

const { SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY, DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY } = process.env;
if (!SOURCE_SUPABASE_URL || !SOURCE_SERVICE_ROLE_KEY || !DEST_SUPABASE_URL || !DEST_SERVICE_ROLE_KEY) {
  console.error("ERROR: set SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY, DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const src = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const dst = createClient(DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Mirror the live buckets, preserving public/private visibility (deal-docs MUST stay private).
const BUCKETS = [
  { id: "avatars", public: true },
  { id: "project-files", public: true },
  { id: "deal-docs", public: false },
];
const LIMIT = 100;

async function ensureDestBucket(b) {
  const { error } = await dst.storage.createBucket(b.id, { public: b.public });
  if (error && !/exist/i.test(error.message || "")) console.error("  createBucket " + b.id + ": " + error.message);
}

// Storage folders have id === null; recurse into them to get every file path.
async function listAll(bucket, prefix = "") {
  let paths = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await src.storage.from(bucket).list(prefix, { limit: LIMIT, offset });
    if (error) { console.error("  list " + bucket + "/" + prefix + ": " + error.message); break; }
    for (const item of data || []) {
      const path = prefix ? prefix + "/" + item.name : item.name;
      if (item.id === null) paths = paths.concat(await listAll(bucket, path));
      else paths.push(path);
    }
    if (!data || data.length < LIMIT) break;
    offset += LIMIT;
  }
  return paths;
}

let copied = 0, failed = 0;
for (const b of BUCKETS) {
  console.log("Bucket: " + b.id);
  await ensureDestBucket(b);
  const paths = await listAll(b.id);
  console.log("  " + paths.length + " files in source");
  for (const p of paths) {
    const dl = await src.storage.from(b.id).download(p);
    if (dl.error) { console.error("  download " + p + ": " + dl.error.message); failed++; continue; }
    const buf = Buffer.from(await dl.data.arrayBuffer());
    const up = await dst.storage.from(b.id).upload(p, buf, { upsert: true, contentType: dl.data.type || "application/octet-stream" });
    if (up.error) { console.error("  upload " + p + ": " + up.error.message); failed++; continue; }
    copied++;
  }
}
console.log("Done. Copied " + copied + " file(s), " + failed + " failed -> " + DEST_SUPABASE_URL);
if (failed > 0) process.exit(1);
