-- 54_self_audit_exclude_extension_fns.sql
-- Refines security_self_audit() so the anon-executable-function check ignores
-- functions owned by an installed EXTENSION (e.g. pg_trgm). Those are pure
-- utility functions (text similarity, index internals) that operate only on
-- their arguments — they cannot read any table or bypass RLS, so anon being
-- able to call them is not a data exposure. Flagging them was noise.
--
-- After migration 53, none of YOUR functions are anon-executable; the only
-- anon-executable functions left are pg_trgm internals. With this exclusion the
-- audit reports a true clean result.
--
-- No grants change here — this only replaces the reporting function.

begin;

create or replace function public.security_self_audit()
returns table(check_name text, status text, detail text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and coalesce((select role::text from public.profiles where id = auth.uid()), '') <> 'master_admin' then
    raise exception 'security_self_audit: master admin only';
  end if;

  -- anon table grants (except the intentional auth_logs INSERT)
  return query
    select 'anon_table_grant'::text, 'EXPOSED'::text,
           format('anon has %s on %I.%I', g.privilege_type, g.table_schema, g.table_name)::text
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee = 'anon'
      and not (g.table_name = 'auth_logs' and g.privilege_type = 'INSERT');

  -- anon-executable functions, EXCLUDING extension-owned utility functions
  return query
    select 'anon_function_exec'::text, 'EXPOSED'::text,
           format('anon can execute %I.%I(%s)', n.nspname, p.proname,
                  pg_get_function_identity_arguments(p.oid))::text
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and not exists (
        select 1 from pg_depend d
        where d.objid = p.oid and d.classid = 'pg_proc'::regclass
          and d.refclassid = 'pg_extension'::regclass and d.deptype = 'e');

  -- tables with RLS disabled
  return query
    select 'rls_disabled'::text, 'EXPOSED'::text,
           format('RLS is OFF on %I.%I', n.nspname, c.relname)::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;

  -- clean bill of health
  if not exists (
        select 1 from information_schema.role_table_grants
        where table_schema='public' and grantee='anon'
          and not (table_name='auth_logs' and privilege_type='INSERT'))
     and not exists (
        select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')
          and not exists (
            select 1 from pg_depend d
            where d.objid = p.oid and d.classid = 'pg_proc'::regclass
              and d.refclassid = 'pg_extension'::regclass and d.deptype = 'e'))
     and not exists (
        select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false)
  then
    return query select 'overall'::text, 'OK'::text,
      'No anon table grants, no anon-executable app functions, RLS on every table.'::text;
  end if;
end $$;

revoke all on function public.security_self_audit() from public, anon;
grant execute on function public.security_self_audit() to authenticated;

commit;

-- VERIFY: select * from public.security_self_audit();  -- expect single OK row
