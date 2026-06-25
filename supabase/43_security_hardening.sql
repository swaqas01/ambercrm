-- 43_security_hardening.sql
-- Amber Homes — security hardening from the Supabase Security Advisor.
-- SAFE / ADDITIVE: changes only EXECUTE grants and function search_path. No data touched, no logic
-- changed, no policy changed. The app calls every RPC below as a logged-in (authenticated) user, so
-- removing the anonymous grant does not affect it.
--
-- WHAT THIS FIXES
--  1. Two real anonymous data leaks:
--       - user_directory()        → returned the full staff list (id, name, role) to anyone, even
--                                    signed out. Now authenticated-only.
--       - check_duplicate_phone() → returned {exists:true/false} to anyone, i.e. an unauthenticated
--                                    "is this phone in the CRM?" oracle. Now authenticated-only.
--  2. Defense-in-depth: every other custom RPC is locked to authenticated. They already check the
--     caller's identity/role internally (verified), so this is belt-and-suspenders, not a new gate.
--  3. Trigger functions are removed from the public API entirely (they only ever run from triggers).
--  4. The 6 functions flagged for a mutable search_path get a fixed search_path (anti-injection).

-- ── 1 & 2. Data/action RPCs: anonymous OFF, authenticated ON ────────────────────────────────────
revoke all on function public.user_directory()                from public, anon;
grant  execute on function public.user_directory()            to authenticated;

revoke all on function public.check_duplicate_phone(text)     from public, anon;
grant  execute on function public.check_duplicate_phone(text) to authenticated;

revoke all on function public.admin_dashboard_stats()         from public, anon;
grant  execute on function public.admin_dashboard_stats()     to authenticated;

revoke all on function public.admin_reveal_usage()            from public, anon;
grant  execute on function public.admin_reveal_usage()        to authenticated;

revoke all on function public.admin_set_reveal_quota(uuid[], integer, boolean, boolean) from public, anon;
grant  execute on function public.admin_set_reveal_quota(uuid[], integer, boolean, boolean) to authenticated;

revoke all on function public.assign_open_lead(uuid)          from public, anon;
grant  execute on function public.assign_open_lead(uuid)      to authenticated;

revoke all on function public.mark_lead_open(uuid, text)      from public, anon;
grant  execute on function public.mark_lead_open(uuid, text)  to authenticated;

revoke all on function public.readd_lead(uuid, jsonb)         from public, anon;
grant  execute on function public.readd_lead(uuid, jsonb)     to authenticated;

revoke all on function public.reveal_contact(uuid)            from public, anon;
grant  execute on function public.reveal_contact(uuid)        to authenticated;

revoke all on function public.security_overview(integer)      from public, anon;
grant  execute on function public.security_overview(integer)  to authenticated;

revoke all on function public.set_my_avatar(text)             from public, anon;
grant  execute on function public.set_my_avatar(text)         to authenticated;

revoke all on function public.auto_open_stale_leads()         from public, anon;
grant  execute on function public.auto_open_stale_leads()     to authenticated;

-- ── 3. Trigger-only functions: remove from the API surface entirely ─────────────────────────────
-- Triggers run regardless of caller EXECUTE rights, so no GRANT is needed back.
revoke all on function public.touch_updated_at()        from public, anon, authenticated;
revoke all on function public.set_lead_no()             from public, anon, authenticated;
revoke all on function public.set_normalized_phone()    from public, anon, authenticated;
revoke all on function public.agent_profiles_touch()    from public, anon, authenticated;
revoke all on function public.targets_touch()           from public, anon, authenticated;
revoke all on function public.handle_new_user()         from public, anon, authenticated;
revoke all on function public.guard_hot_deal()          from public, anon, authenticated;
revoke all on function public.guard_protected_columns() from public, anon, authenticated;
revoke all on function public.notify_hot_deal()         from public, anon, authenticated;

-- ── 4. Fix mutable search_path on the 6 flagged functions ───────────────────────────────────────
alter function public.touch_updated_at()      set search_path = public, pg_temp;
alter function public.set_lead_no()           set search_path = public, pg_temp;
alter function public.normalize_phone(text)   set search_path = public, pg_temp;
alter function public.set_normalized_phone()  set search_path = public, pg_temp;
alter function public.agent_profiles_touch()  set search_path = public, pg_temp;
alter function public.targets_touch()         set search_path = public, pg_temp;
