-- Optional: opt in early to Supabase #45329 behavior — NEW objects created by postgres in public
-- will NOT get implicit Data API grants. You must add explicit GRANT in each migration.
-- Discussion: https://github.com/orgs/supabase/discussions/45329
--
-- Run manually against your project (or paste into a one-off migration) after you are ready
-- to maintain explicit grants for every new table/view/sequence.

alter default privileges for role postgres in schema public revoke all on tables from postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on routines from postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on types from postgres, anon, authenticated, service_role;
