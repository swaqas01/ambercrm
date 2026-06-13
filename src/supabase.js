import { createClient } from "@supabase/supabase-js";

// The publishable key is safe to ship in the app (protected by Row-Level Security).
// Vercel env vars override these defaults if set.
const URL = import.meta.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3M0eOBeRvTuC8yjMWWcEqg_BPZfYyKJ";

export const supabase = createClient(URL, KEY);

// Map the database role to the app's display + routing
export function roleInfo(dbRole) {
  if (dbRole === "master_admin") return { label: "Master Admin", home: "admin" };
  if (dbRole === "admin")        return { label: "Admin",        home: "admin" };
  return { label: "Agent", home: "agent" };
}
