-- Rollback / restore default privileges after using 45329-opt-in-revoke-default-privileges.sql
-- Source: FAQ in https://github.com/orgs/supabase/discussions/45329

alter default privileges for role postgres in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on routines to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on types to postgres, anon, authenticated, service_role;

-- Bulk fix for objects created while stricter defaults were active (matches discussion FAQ for tables/sequences).
-- Do not blanket-grant EXECUTE on all functions here — re-lock RPCs with migration
-- 20260514120001_data_api_explicit_grants_45329.sql (clear_* stays service_role only).
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
