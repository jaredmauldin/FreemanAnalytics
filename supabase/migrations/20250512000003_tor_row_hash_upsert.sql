-- Stable fingerprint per TOR row for dedupe + upsert (multiple NULL row_hash allowed for legacy rows).
alter table public.tor_events add column if not exists row_hash text;

create unique index if not exists tor_events_row_hash_uidx on public.tor_events (row_hash);

-- Replace-all: wipe imports and events (call from app with service role).
create or replace function public.clear_tor_import_data ()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  delete from public.tor_events;
  delete from public.uploads;
end;
$$;

revoke all on function public.clear_tor_import_data () from public;
grant execute on function public.clear_tor_import_data () to service_role;
