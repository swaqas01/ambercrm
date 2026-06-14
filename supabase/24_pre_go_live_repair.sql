-- 24_pre_go_live_repair.sql
-- Amber Homes — pre-go-live schema repair.
-- SAFE & IDEMPOTENT. Additive only. Deletes nothing, truncates nothing, overwrites nothing.
-- Run in Supabase -> SQL Editor (after 01-23). Wrapped in DO blocks so it can never block.
--
-- AUDIT FINDING (the only code<->database gap found): the app uploads profile photos to a storage
-- bucket named 'avatars' (src/App.jsx: storage.from('avatars').upload(uid + '/avatar.ext')), but no
-- earlier migration creates that bucket or its policies — unlike 'project-files' (08) and 'deal-docs'
-- (10). If the bucket was never created in the dashboard, profile-photo upload fails. This creates it
-- safely with the correct ownership policies.

-- 1) Public 'avatars' bucket (public so getPublicUrl works for displaying photos).
do $$
begin
  insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
exception when others then null;
end $$;

-- 2) Policies: anyone may READ (public profile photos); a signed-in user may write ONLY inside their
--    own folder ({uid}/...); admins may manage any. Mirrors the project-files / deal-docs pattern.
do $$
begin
  drop policy if exists avatars_read on storage.objects;
  create policy avatars_read on storage.objects
    for select using ( bucket_id = 'avatars' );

  drop policy if exists avatars_insert_own on storage.objects;
  create policy avatars_insert_own on storage.objects
    for insert with check (
      bucket_id = 'avatars'
      and ( public.is_admin() or auth.uid()::text = (storage.foldername(name))[1] )
    );

  drop policy if exists avatars_update_own on storage.objects;
  create policy avatars_update_own on storage.objects
    for update using (
      bucket_id = 'avatars'
      and ( public.is_admin() or auth.uid()::text = (storage.foldername(name))[1] )
    );

  drop policy if exists avatars_delete_own on storage.objects;
  create policy avatars_delete_own on storage.objects
    for delete using (
      bucket_id = 'avatars'
      and ( public.is_admin() or auth.uid()::text = (storage.foldername(name))[1] )
    );
exception when others then null;
end $$;

-- =====================================================================
-- Everything else in the audit was already consistent between code and schema:
--   * every RPC the app calls (reveal_contact, mark_lead_open, assign_open_lead, check_duplicate_phone,
--     auto_open_stale_leads) is defined in migrations 12/20/22/23.
--   * every table the app queries exists; lead_reveals/security_alerts are reached only through the
--     SECURITY DEFINER RPCs, by design.
--   * column naming is consistent (leads.project / assigned_agent / created_by / next_followup /
--     last_contacted / opened_reason / original_agent / normalized_phone / lead_type). 'project_name'
--     belongs to hot_resale_deals, not leads — not a mismatch.
--   * no server secret is referenced in the client bundle; the frontend uses only VITE_SUPABASE_URL
--     and VITE_SUPABASE_ANON_KEY.
-- No further schema repair was required. Remaining items are dashboard/runtime checks (see
-- PRODUCTION_SAFETY_CHECKLIST.md and PRE_GO_LIVE_SMOKE_TEST.md).
-- =====================================================================
