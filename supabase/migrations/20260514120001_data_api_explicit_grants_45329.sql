-- Explicit Data API (PostgREST / supabase-js) grants for FreemanAnalytics public schema.
-- Context: https://github.com/orgs/supabase/discussions/45329 — new tables may not receive
-- implicit anon/authenticated/service_role grants; this locks in access for current objects.
-- Safe to run repeatedly (GRANT is idempotent for same privileges).

grant usage on schema public to postgres, anon, authenticated, service_role;

-- Core tables (browser clients may use anon/authenticated; server uses service_role)
grant select, insert, update, delete on table public.uploads to anon, authenticated;
grant select, insert, update, delete on table public.tor_events to anon, authenticated;
grant select, insert, update, delete on table public.lookup_values to anon, authenticated;
grant select, insert, update, delete on table public.exterior_alarm_events to anon, authenticated;
grant select, insert, update, delete on table public.supervisor_ot_entries to anon, authenticated;

grant all on table public.uploads to postgres, service_role;
grant all on table public.tor_events to postgres, service_role;
grant all on table public.lookup_values to postgres, service_role;
grant all on table public.exterior_alarm_events to postgres, service_role;
grant all on table public.supervisor_ot_entries to postgres, service_role;

-- Read models for grids / analytics
grant select on public.v_tor_events_flat to anon, authenticated, service_role;
grant select on public.v_exterior_alarms_flat to anon, authenticated, service_role;
grant select on public.v_supervisor_ot_flat to anon, authenticated, service_role;

-- Sequences in public (e.g. if any serial/bigserial columns exist later)
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- RPCs: keep service_role-only execute (app upload replace flow)
revoke all on function public.clear_tor_import_data () from public;
grant execute on function public.clear_tor_import_data () to service_role;

revoke all on function public.clear_exterior_alarm_import_data () from public;
grant execute on function public.clear_exterior_alarm_import_data () to service_role;

revoke all on function public.clear_supervisor_ot_import_data () from public;
grant execute on function public.clear_supervisor_ot_import_data () to service_role;
