-- =====================================================================
-- Amber Lead Desk — Migration 08: Projects Knowledge Base + files + downloads
-- Safe & idempotent. Run in Supabase → SQL Editor.
-- =====================================================================
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  developer       text,
  area            text,
  property_type   text,
  starting_price  text,
  payment_plan    text,
  handover_date   text,
  commission_pct  text,
  unit_types      text,
  bedroom_options text,
  selling_points  text,
  investment_points text,
  risks_notes     text,
  golden_visa     text,
  target_client   text,
  status          text not null default 'active',   -- active | upcoming | sold_out | inactive
  launch_date     date,
  talking_points  text,
  do_not_say      text,
  agent_visible   boolean not null default true,
  review_date     date,
  added_by        uuid references public.profiles(id),
  updated_by      uuid references public.profiles(id),
  deleted         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists projects_active_idx on public.projects(status, deleted, agent_visible);

create table if not exists public.project_files (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  kind          text not null default 'brochure',  -- brochure | floorplan | paymentplan | pricelist | image | other
  file_name     text not null,
  url           text not null,                       -- Supabase Storage public URL or external link
  internal_only boolean not null default false,
  uploaded_by   uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
create index if not exists project_files_project_idx on public.project_files(project_id);

create table if not exists public.file_downloads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id),
  user_name   text,
  user_role   text,
  project_id  uuid references public.projects(id) on delete set null,
  file_name   text,
  created_at  timestamptz not null default now()
);

alter table public.projects       enable row level security;
alter table public.project_files  enable row level security;
alter table public.file_downloads enable row level security;

-- Projects: admins manage; agents read active, agent-visible, non-deleted projects.
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select using (
  public.is_admin() or (deleted = false and agent_visible = true and status <> 'inactive')
);
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert with check ( public.is_admin() );
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update using ( public.is_admin() ) with check ( public.is_admin() );

-- Project files: admins manage; agents read non-internal files of visible projects.
drop policy if exists project_files_select on public.project_files;
create policy project_files_select on public.project_files for select using (
  public.is_admin() or ( internal_only = false and exists (
    select 1 from public.projects p where p.id = project_id and p.deleted = false and p.agent_visible = true and p.status <> 'inactive') )
);
drop policy if exists project_files_insert on public.project_files;
create policy project_files_insert on public.project_files for insert with check ( public.is_admin() );
drop policy if exists project_files_update on public.project_files;
create policy project_files_update on public.project_files for update using ( public.is_admin() ) with check ( public.is_admin() );
drop policy if exists project_files_delete on public.project_files;
create policy project_files_delete on public.project_files for delete using ( public.is_admin() );

-- Downloads log: any authenticated user can record their own download; admins read all.
drop policy if exists file_downloads_insert on public.file_downloads;
create policy file_downloads_insert on public.file_downloads for insert with check ( auth.role() = 'authenticated' );
drop policy if exists file_downloads_select on public.file_downloads;
create policy file_downloads_select on public.file_downloads for select using ( public.is_admin() or user_id = auth.uid() );

-- Storage bucket for uploads (best-effort; if this errors, create a PUBLIC bucket
-- named 'project-files' in Supabase → Storage instead). Wrapped so it never blocks the migration.
do $$
begin
  insert into storage.buckets (id, name, public) values ('project-files', 'project-files', true)
  on conflict (id) do nothing;
exception when others then null;
end $$;

do $$
begin
  drop policy if exists project_files_read on storage.objects;
  create policy project_files_read on storage.objects for select using ( bucket_id = 'project-files' );
  drop policy if exists project_files_write on storage.objects;
  create policy project_files_write on storage.objects for insert with check ( bucket_id = 'project-files' and public.is_admin() );
  drop policy if exists project_files_modify on storage.objects;
  create policy project_files_modify on storage.objects for update using ( bucket_id = 'project-files' and public.is_admin() );
exception when others then null;
end $$;

-- =====================================================================
-- DONE.
-- =====================================================================
