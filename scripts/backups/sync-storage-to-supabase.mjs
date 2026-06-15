#!/usr/bin/env node
/**
 * Amber Homes CRM — STORAGE replication to a SECOND Supabase project (secondary backup, Layer 3).
 * Diagnostic edition: prints exactly what is wrong if it fails.
 *
 * Env: SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY, DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";

const { SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY, DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY } = process.env;

const keyHint = (k) => (!k ? "(MISSING)" : k.slice(0, 12) + "… (length " + k.length + ")");

console.log("=== Amber CRM storage backup ===");
console.log("SOURCE_SUPABASE_URL :", SOURCE_SUPABASE_URL || "(MISSING)");
console.log("DEST_SUPABASE_URL   :", DEST_SUPABASE_URL || "(MISSING)");
console.log("SOURCE key          :", keyHint(SOURCE_SERVICE_ROLE_KEY));
console.log("DEST key            :", keyHint(DEST_SERVICE_ROLE_KEY));
console.log("");

if (!SOURCE_SUPABASE_URL || !SOURCE_SERVICE_ROLE_KEY || !DEST_SUPABASE_URL || !DEST_SERVICE_ROLE_KEY) {
  console.error("ERROR: one or more of the 4 secrets is empty. Re-check the secret NAMES in GitHub (exact spelling).");
  process.exit(1);
}
if (SOURCE_SUPABASE_URL.replace(/\/+$/, "") === DEST_SUPABASE_URL.replace(/\/+$/, "")) {
  console.error("ERROR: SOURCE and DEST URLs are the SAME. They must be two different projects (live vs backup).");
  process.exit(1);
}
for (const [label, k] of [["SOURCE", SOURCE_SERVICE_ROLE_KEY], ["DEST", DEST_SERVICE_ROLE_KEY]]) {
  if (k.startsWith("sb_publishable_") || k.startsWith("sbp_")) {
    console.error("ERROR: the " + label + " key is a PUBLISHABLE key. You need the SECRET / service_role key (sb_secret_… or a long eyJ… token), NOT the publishable one.");
    process.exit(1);
  }
}

const src = createClient(SOURCE_SUPABASE_URL.replace(/\/+$/, ""), SOURCE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const dst = createClient(DEST_SUPABASE_URL.replace(/\/+$/, ""), DEST_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BUCKETS = [
  { id: "avatars", public: true },
  { id: "project-files", public: true },
  { id: "deal-docs", public: false },
];
const LIMIT = 100;

async function ensureDestBucket(b) {
  const { error } = await dst.storage.createBucket(b.id, { public: b.public });
  if (error && !/exist/i.test(error.message || "")) { console.error("  [DEST] createBucket " + b.id + " FAILED: " + error.message); return false; }
  return true;
}
async function listAll(bucket, prefix = "") {
  let paths = [], offset = 0;
  for (;;) {
    const { data, error } = await src.storage.from(bucket).list(prefix, { limit: LIMIT, offset });
    if (error) { console.error("  [SOURCE] list " + bucket + "/" + prefix + " FAILED: " + error.message); return paths; }
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
try {
  for (const b of BUCKETS) {
    console.log("Bucket: " + b.id);
    if (!(await ensureDestBucket(b))) { failed++; continue; }
    const paths = await listAll(b.id);
    console.log("  source files: " + paths.length);
    for (const p of paths) {
      const dl = await src.storage.from(b.id).download(p);
      if (dl.error) { console.error("  [SOURCE] download " + p + " FAILED: " + dl.error.message); failed++; continue; }
      const buf = Buffer.from(await dl.data.arrayBuffer());
      const up = await dst.storage.from(b.id).upload(p, buf, { upsert: true, contentType: dl.data.type || "application/octet-stream" });
      if (up.error) { console.error("  [DEST] upload " + p + " FAILED: " + up.error.message); failed++; continue; }
      copied++;
    }
  }
} catch (e) {
  console.error("UNEXPECTED ERROR: " + (e && e.stack ? e.stack : e));
  process.exit(1);
}
console.log("");
console.log("=== Done. Copied " + copied + " file(s); " + failed + " failure(s). ===");
if (failed > 0) process.exit(1);
