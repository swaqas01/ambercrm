-- 18_agent_photos_perf.sql
-- Agent profile photos (Supabase Storage) + accurate self-activity reads + performance indexes.
-- SAFE & IDEMPOTENT. Deletes nothing. Run in Supabase -> SQL Editor.
-- profiles.avatar_url already exists (added in migration 13) — no column change needed.

-- 1) Public 'avatars' storage bucket for profile photos.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 1a) Anyone can READ avatars (public profile photos shown across the app).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using ( bucket_id = 'avatars' );

-- 1b) A signed-in user may upload / replace / delete ONLY their own photo
--     (path must start with their user id: "<uid>/avatar.jpg").
drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects
  for update to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text )
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

-- 2) Let an agent reliably read THEIR OWN activity rows even if the lead was later
--    reassigned away (needed for accurate personal call/WhatsApp/follow-up counts).
--    This only lets a user read rows they themselves created — no new data exposure.
drop policy if exists activity_select on public.lead_activity;
create policy activity_select on public.lead_activity for select using (
  public.is_admin()
  or actor_id = auth.uid()
  or exists ( select 1 from public.leads l where l.id = lead_id and (
        l.assigned_agent = auth.uid() or l.current_owner = auth.uid()
        or l.created_by = auth.uid() or l.is_open = true ) )
);

-- 3) Performance indexes for fast dashboard aggregation (no full-table scans).
create index if not exists activity_actor_created_idx on public.lead_activity(actor_id, created_at);
create index if not exists deals_status_decided_idx   on public.deals(status, decided_at);
create index if not exists leads_assigned_created_idx  on public.leads(assigned_agent, created_at);

-- Verify:
-- select id, public from storage.buckets where id = 'avatars';
-- select policyname from pg_policies where tablename = 'objects' and policyname like 'avatars%';
