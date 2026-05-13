-- Fix "permission denied for table uploads" when RLS is on with no policies,
-- or when table privileges were not inherited as expected.

alter table if exists public.uploads disable row level security;
alter table if exists public.tor_events disable row level security;

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on table public.uploads to postgres, service_role;
grant all on table public.tor_events to postgres, service_role;

-- If you later call Supabase from the browser with the anon key, these allow CRUD
-- (RLS is off for these two tables only—tighten before exposing anon publicly).
grant select, insert, update, delete on table public.uploads to anon, authenticated;
grant select, insert, update, delete on table public.tor_events to anon, authenticated;
