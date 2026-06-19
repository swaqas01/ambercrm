-- 32_agent_profiles.sql
-- Agent professional + signature profile data, and a SAFE self-avatar setter.
-- SAFE & IDEMPOTENT. Deletes nothing. Changes no existing data. Weakens no existing RLS.
-- Run in Supabase -> SQL Editor.
--
-- Why a separate table (not new columns on profiles):
--   profiles holds security fields (role, active). profiles has only an ADMIN update policy,
--   so agents cannot self-edit it. Putting editable fields here lets agents own their own
--   profile row WITHOUT ever being able to touch role / active (no privilege escalation).

-- 1) Editable agent profile + signature fields ------------------------------------------
create table if not exists public.agent_profiles (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  -- professional
  brn                  text,
  phone                text,
  whatsapp             text,
  job_title            text,
  languages            text,
  specialization       text,
  bio                  text,
  nationality          text,
  -- social
  social_instagram     text,
  social_linkedin      text,
  social_tiktok        text,
  social_youtube       text,
  website              text,
  -- signature block (reused later by templates / PDFs / message footers)
  signature_name       text,
  signature_title      text,
  signature_phone      text,
  signature_whatsapp   text,
  signature_email      text,
  signature_brn        text,
  signature_disclaimer text,
  signature_photo_url  text,
  updated_at           timestamptz not null default now(),
  created_at           timestamptz not null default now()
);

alter table public.agent_profiles enable row level security;

-- Read: the agent themselves, or an admin/master (is_admin() = master_admin|admin).
drop policy if exists agent_profiles_select on public.agent_profiles;
create policy agent_profiles_select on public.agent_profiles for select
  using ( user_id = auth.uid() or public.is_admin() );

-- Insert: only your own row (or admin on behalf of an agent).
drop policy if exists agent_profiles_insert on public.agent_profiles;
create policy agent_profiles_insert on public.agent_profiles for insert
  with check ( user_id = auth.uid() or public.is_admin() );

-- Update: only your own row (or admin).
drop policy if exists agent_profiles_update on public.agent_profiles;
create policy agent_profiles_update on public.agent_profiles for update
  using ( user_id = auth.uid() or public.is_admin() )
  with check ( user_id = auth.uid() or public.is_admin() );

-- Delete: master only.
drop policy if exists agent_profiles_delete on public.agent_profiles;
create policy agent_profiles_delete on public.agent_profiles for delete
  using ( public.is_master() );

-- keep updated_at fresh
create or replace function public.agent_profiles_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists agent_profiles_touch_trg on public.agent_profiles;
create trigger agent_profiles_touch_trg before update on public.agent_profiles
  for each row execute function public.agent_profiles_touch();

-- 2) SAFE self-avatar setter ------------------------------------------------------------
-- profiles has no self-update policy (by design, so agents can't change role/active).
-- This SECURITY DEFINER function lets a signed-in user persist ONLY their own avatar_url.
create or replace function public.set_my_avatar(p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set avatar_url = p_url where id = auth.uid();
end $$;
grant execute on function public.set_my_avatar(text) to authenticated;

-- 3) Performance helper index (fast follow-up overdue / due-today reads) -----------------
create index if not exists followups_agent_status_due_idx on public.follow_ups(agent_id, status, due_at);

-- Verify:
-- select count(*) from public.agent_profiles;
-- select policyname from pg_policies where tablename = 'agent_profiles';
-- select proname from pg_proc where proname = 'set_my_avatar';
