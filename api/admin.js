// Secure admin backend for user/agent management.
// Holds the Supabase SERVICE ROLE key (server-side only). Verifies the caller
// is a Master Admin before doing anything. Never import this from the browser.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fkeniejcitwlqfatkopi.supabase.co";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SERVICE_KEY) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set in Vercel environment variables." });

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // --- verify caller is a Master Admin ---
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in." });
  const { data: who, error: whoErr } = await svc.auth.getUser(token);
  if (whoErr || !who?.user) return res.status(401).json({ error: "Invalid session." });
  const callerId = who.user.id;
  const { data: caller } = await svc.from("profiles").select("role, full_name").eq("id", callerId).single();
  if (!caller || caller.role !== "master_admin")
    return res.status(403).json({ error: "Only the Master Admin can manage users." });

  const { action, payload = {} } = req.body || {};
  const audit = (a, affected, oldV, newV, detail) =>
    svc.from("admin_audit").insert({ action: a, performed_by: callerId, affected_user: affected || null,
      old_value: oldV || null, new_value: newV || null, detail: detail || null });
  const notify = (title, body, link) =>
    svc.from("notifications").insert({ user_id: null, kind: "system", title, body, link_screen: link || "users" });

  try {
    if (action === "list_users") {
      const { data: list } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
      const { data: profs } = await svc.from("profiles").select("*");
      const { data: leads } = await svc.from("leads").select("assigned_agent, assigned_agent_name, is_open, status");
      const pById = Object.fromEntries((profs || []).map((p) => [p.id, p]));
      const users = (list?.users || []).map((u) => {
        const p = pById[u.id] || {};
        const mine = (leads || []).filter((l) => l.assigned_agent === u.id || (p.full_name && l.assigned_agent_name === p.full_name));
        return { id: u.id, email: u.email, full_name: p.full_name, role: p.role, active: p.active !== false,
          phone: p.phone, department: p.department, job_title: p.job_title, lead_scope: p.lead_scope,
          notes: p.notes, last_login: u.last_sign_in_at, created_at: u.created_at, banned: !!u.banned_until,
          assigned_leads: mine.length, open_leads: mine.filter((l) => l.is_open).length };
      });
      return res.status(200).json({ users });
    }

    if (action === "create_user") {
      const { email, password, full_name, role, phone, department, job_title, lead_scope, notes, twofa, status } = payload;
      if (!email || !password || !full_name || !role) return res.status(400).json({ error: "Name, email, role and password are required." });
      const { data: created, error } = await svc.auth.admin.createUser({
        email: email.trim().toLowerCase(), password, email_confirm: true, user_metadata: { full_name } });
      if (error) return res.status(400).json({ error: error.message });
      const id = created.user.id;
      await svc.from("profiles").update({ full_name, role, phone: phone || null, department: department || null,
        job_title: job_title || null, lead_scope: lead_scope || "own", notes: notes || null, created_by: callerId,
        force_password_change: true, twofa_required: !!twofa, active: status !== "inactive" }).eq("id", id);
      await audit("user_created", id, null, { email, role }, full_name);
      await notify("New user created", `${full_name} (${role}) was added.`, "users");
      return res.status(200).json({ ok: true, id });
    }

    if (action === "reset_password") {
      const { id, password, force } = payload;
      if (!id || !password) return res.status(400).json({ error: "Missing id or password." });
      const { error } = await svc.auth.admin.updateUserById(id, { password });
      if (error) return res.status(400).json({ error: error.message });
      if (force) await svc.from("profiles").update({ force_password_change: true }).eq("id", id);
      await audit("password_reset", id, null, null, null);
      return res.status(200).json({ ok: true });
    }

    if (action === "set_role") {
      const { id, role, oldRole } = payload;
      const { error } = await svc.from("profiles").update({ role }).eq("id", id);
      if (error) return res.status(400).json({ error: error.message });
      await audit("role_changed", id, { role: oldRole }, { role });
      await notify("Role changed", `A user's role was changed to ${role}.`, "users");
      return res.status(200).json({ ok: true });
    }

    if (action === "update_user") {
      const { id, fields } = payload;
      const { error } = await svc.from("profiles").update(fields || {}).eq("id", id);
      if (error) return res.status(400).json({ error: error.message });
      await audit("user_edited", id, null, fields);
      return res.status(200).json({ ok: true });
    }

    if (action === "set_active") {
      const { id, active, reason, leadAction, reassignTo, reassignName, userName } = payload;
      if (active) {
        await svc.auth.admin.updateUserById(id, { ban_duration: "none" });
        await svc.from("profiles").update({ active: true, deactivated_at: null, deactivated_by: null, deactivation_reason: null }).eq("id", id);
        await audit("user_reactivated", id);
        await notify("User reactivated", "A user was reactivated.", "users");
        return res.status(200).json({ ok: true });
      }
      // deactivate: block login
      await svc.auth.admin.updateUserById(id, { ban_duration: "876000h" });
      await svc.from("profiles").update({ active: false, deactivated_at: new Date().toISOString(),
        deactivated_by: callerId, deactivation_reason: reason || null }).eq("id", id);
      // handle that user's active (non-closed) leads
      let affected = 0;
      const match = (q) => q.or(`assigned_agent.eq.${id}` + (userName ? `,assigned_agent_name.eq.${userName}` : ""))
        .not("status", "in", '("Closed Won","Closed Lost","Dead Lead")');
      if (leadAction === "open") {
        const { data, error } = await match(svc.from("leads").update({ is_open: true, opened_reason: "Agent deactivated",
          opened_by: callerId, opened_at: new Date().toISOString(), opened_auto: false }).select("id"));
        if (!error && data) affected = data.length;
        await audit("leads_moved", id, null, { count: affected }, "moved to open pool");
      } else if (leadAction === "reassign" && (reassignTo || reassignName)) {
        const { data, error } = await match(svc.from("leads").update({ assigned_agent: reassignTo || null,
          assigned_agent_name: reassignName || null }).select("id"));
        if (!error && data) affected = data.length;
        await audit("leads_reassigned", id, null, { count: affected, to: reassignName }, "reassigned");
      }
      await audit("user_deactivated", id, null, { reason, leadAction, affected });
      await notify("User deactivated", `A user was deactivated. ${affected} active lead(s) ${leadAction === "open" ? "moved to open pool" : leadAction === "reassign" ? "reassigned" : "kept"}.`, "users");
      return res.status(200).json({ ok: true, affected });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
