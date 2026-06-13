# Stage 1 — Create the database (5 minutes)

This sets up your real database with security. It touches ONLY your Supabase
database — your live website is not affected by this step.

## Steps
1. Go to **supabase.com** → open your **amber-crm** project.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `01_schema.sql`, copy ALL of it, paste into the editor.
4. Click **Run** (bottom right). You should see "Success. No rows returned."
   - It's safe to run more than once if needed.
5. Left sidebar → **Table Editor** — you should now see 4 tables:
   `profiles`, `leads`, `lead_activity`, `lead_ownership_history`.

## Then create YOUR login (Master Admin)
6. Left sidebar → **Authentication** → **Users** → **Add user** → **Create new user**.
   - Email: your email (e.g. saad@amberholdings.com)
   - Password: choose a strong one
   - Tick **Auto Confirm User** so you can log in immediately.
7. Back in **SQL Editor**, run this one line to make yourself Master Admin
   (replace the email with the one you just used):

   update public.profiles set role = 'master_admin'
   where email = 'saad@amberholdings.com';

That's it for Stage 1. Tell Claude "database is ready" and Stage 2 begins:
wiring real login + your database into the live app.
