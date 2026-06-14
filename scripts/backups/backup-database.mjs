#!/usr/bin/env node
/**
 * Amber Homes CRM — DATABASE export (secondary backup, Layer 2).
 *
 * Connects with the Supabase SERVICE-ROLE key (full read) and writes one JSON file per core table,
 * CSV for the large ones, and a manifest with row counts + SHA-256 checksums.
 *
 * SECURITY: the service-role key is read from an ENV VAR — never hard-code it, never commit output.
 * Store the output folder in an ENCRYPTED, PRIVATE location (S3/R2/GCS or an encrypted disk).
 *
 * Usage:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/backups/backup-database.mjs [outputDir]
 *
 * Requires: npm i @supabase/supabase-js  (already a project dependency)
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("ERROR: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUT = join(process.argv[2] || "./backup-output", "db-" + stamp);
mkdirSync(OUT, { recursive: true });

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Core tables to export. Keep this list in sync as the schema grows.
const TABLES = [
  "profiles", "leads", "lead_activity", "lead_comments", "lead_ownership_history", "follow_ups",
  "lead_reveals", "security_alerts", "open_leads_settings", "app_settings",
  "deals", "deal_activity", "deal_documents", "hot_resale_deals",
  "projects", "project_files", "file_downloads",
  "ai_knowledge", "ai_logs", "ai_sources", "ai_web_log",
  "notifications", "admin_audit", "auth_logs",
];
// Also emit CSV (not just JSON) for the tables a human is most likely to open in Excel.
const CSV_TABLES = new Set(["leads", "lead_activity", "deals"]);

const PAGE = 1000; // Supabase returns max 1000 rows/request

function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v) => (v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v))).replace(/"/g, '""');
  return cols.join(",") + "\n" + rows.map((r) => cols.map((c) => '"' + cell(r[c]) + '"').join(",")).join("\n");
}

async function dumpTable(table) {
  let rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + PAGE - 1);
    if (error) { console.error("  " + table + ": " + error.message); return { table, error: error.message }; }
    rows = rows.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  const json = JSON.stringify(rows);
  writeFileSync(join(OUT, table + ".json"), json);
  if (CSV_TABLES.has(table)) writeFileSync(join(OUT, table + ".csv"), toCsv(rows));
  console.log("  " + table + ": " + rows.length + " rows");
  return { table, rows: rows.length, sha256: createHash("sha256").update(json).digest("hex") };
}

const manifest = { created_at: new Date().toISOString(), source: SUPABASE_URL, tables: [] };
console.log("Exporting database -> " + OUT);
for (const t of TABLES) manifest.tables.push(await dumpTable(t));
writeFileSync(join(OUT, "backup-manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Done. Manifest written to " + join(OUT, "backup-manifest.json"));
console.log("REMINDER: store this folder in an ENCRYPTED, PRIVATE location. NEVER commit it to git.");
