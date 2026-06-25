-- 46_storage_bucket_listing.sql
-- Amber Homes — close "public bucket allows listing" (Security Advisor) on avatars & project-files.
-- SAFE: these are PUBLIC buckets, so direct object URLs (getPublicUrl) keep working WITHOUT any SELECT
-- policy — Supabase serves public-bucket objects regardless of RLS. The app only uploads and builds
-- public URLs; it never calls .list() on these buckets (verified in src/App.jsx). The broad SELECT
-- policies below ONLY enable listing every file in the bucket via the API, which is exactly what we
-- want to stop. INSERT/upload policies are untouched, so uploads continue to work.

drop policy if exists "avatars_public_read" on storage.objects;   -- avatars: was listable
drop policy if exists "avatars_read"        on storage.objects;   -- avatars: duplicate listable policy
drop policy if exists "project_files_read"  on storage.objects;   -- project-files: was listable

-- NOTE: project-files remains a PUBLIC bucket, so its objects are still reachable by anyone who has the
-- exact URL — listing is now disabled, but the files are not private. If project documents are
-- sensitive, the stronger fix is to make the bucket PRIVATE and serve files via signed URLs (the same
-- pattern deal-docs already uses). That needs a small app change; ask if you want it.
