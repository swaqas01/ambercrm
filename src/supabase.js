import { createClient } from "@supabase/supabase-js";

// The publishable key is safe to ship in the app (protected by Row-Level Security).
const URL = import.meta.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";

export const supabase = createClient(URL, KEY);

const ROLES = {
  master_admin: { label: "Master Admin", home: "admin" },
  admin:        { label: "Admin",         home: "admin" },
  sales_manager:{ label: "Sales Manager", home: "admin" },
  agent:        { label: "Agent",         home: "agent" },
  marketing:    { label: "Marketing",     home: "admin" },
  accounts:     { label: "Accounts",      home: "admin" },
};
export function roleInfo(dbRole) { return ROLES[dbRole] || { label: "Agent", home: "agent" }; }

// Which sidebar screens each role may open. 'users' is Master-Admin only.
const SCREEN_ACCESS = {
  master_admin: "ALL",
  admin:        ["admin","live","open","lead","assign","pipeline","performance","security","matching","score","careers","commission","settings"],
  sales_manager:["admin","live","open","lead","assign","pipeline","performance","matching","score","settings"],
  agent:        ["agent","live","open","lead","settings"],
  marketing:    ["admin","live","open","lead","settings"],
  accounts:     ["admin","commission","lead","settings"],
};
export function allowedFor(role) { return SCREEN_ACCESS[role] || SCREEN_ACCESS.agent; }
export function canOpen(role, screen) { const a = allowedFor(role); return a === "ALL" || a.includes(screen); }

// Call after login to record last_login (best-effort).
export async function stampLogin(userId) {
  try { await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", userId); } catch (e) {}
}

// Helper for the frontend to call the secure admin backend.
export async function adminCall(action, payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/admin", { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session?.access_token || "") },
    body: JSON.stringify({ action, payload }) });
  return res.json();
}
