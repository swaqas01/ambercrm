-- 16_master_admin.sql
-- Purpose: guarantee saad@amberhomes.ae is the ONE and ONLY Master Admin — with ZERO data loss.
-- This is the real fix for: "Only Master Admin can make it" (AI Knowledge Base) and Ask Amber
-- saying "you have no leads". Those happen when the database role for saad@amberhomes.ae is not
-- master_admin, because Row-Level Security (is_admin()/is_master()) reads the role straight from
-- this table. The app already treats this account as Master Admin in the UI, but the DATABASE must
-- also say so for KB writes and the all-leads view to work.
--
-- SAFE: idempotent (run as many times as you like). Deletes nothing. Touches only this one account.
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.

-- 0) Backfill profiles.email from auth so the email-based match below is reliable.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

-- 1) THE FIX — make saad@amberhomes.ae a Master Admin. Only this exact email is affected.
--    Saad Rizwan (a different email) is NOT touched and keeps whatever role he already has.
update public.profiles
set role = 'master_admin'
where lower(email) = 'saad@amberhomes.ae'
  and role is distinct from 'master_admin';

-- 1a) Edge case: auth user exists but has no profile row -> create it as Master Admin.
insert into public.profiles (id, email, full_name, role, active)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', 'Saad Waqas'), 'master_admin', true
from auth.users u
where lower(u.email) = 'saad@amberhomes.ae'
  and not exists (select 1 from public.profiles p where p.id = u.id);

-- 2) OPTIONAL — database-level lock (commented out by default).
--    Uncomment ONLY if you want the DB itself to auto-reassert Master Admin on saad@amberhomes.ae
--    on every future profile change, and prevent that account from being demoted or deactivated.
--    The app already enforces this, so this is pure belt-and-suspenders.
--
-- create or replace function public.enforce_master_admin()
-- returns trigger language plpgsql as $$
-- begin
--   if lower(new.email) = 'saad@amberhomes.ae' then
--     new.role := 'master_admin';
--     new.active := true;
--   end if;
--   return new;
-- end $$;
-- drop trigger if exists trg_enforce_master_admin on public.profiles;
-- create trigger trg_enforce_master_admin
--   before insert or update on public.profiles
--   for each row execute function public.enforce_master_admin();

-- 3) READ-ONLY CHECKS — these only SELECT, they change nothing. Run them to confirm.
-- 3a) Saad is now Master Admin:
--     select email, full_name, role, active from public.profiles where lower(email) = 'saad@amberhomes.ae';
-- 3b) There should be EXACTLY ONE Master Admin (saad@amberhomes.ae):
--     select email, full_name, role from public.profiles where role = 'master_admin' order by email;
-- 3c) Saad Rizwan (if he exists) is still an Agent and was untouched:
--     select email, full_name, role from public.profiles where full_name ilike '%saad rizwan%';
-- 3d) Any auth users missing a profile row (should return no rows):
--     select u.id, u.email from auth.users u
--     left join public.profiles p on p.id = u.id where p.id is null;
