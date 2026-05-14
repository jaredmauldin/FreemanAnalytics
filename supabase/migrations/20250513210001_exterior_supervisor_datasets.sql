-- Exterior Alarms & Faults + Supervisor Overtime workbooks: normalized tables, views, clear RPCs.
-- Fixes clear_tor_import_data to only remove TOR dataset uploads (not other datasets).

alter table public.uploads add column if not exists dataset text not null default 'tor';

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'uploads' and c.conname = 'uploads_dataset_check'
  ) then
    alter table public.uploads
      add constraint uploads_dataset_check
      check (dataset in ('tor', 'exterior_alarms', 'supervisor_ot'));
  end if;
end $$;

create or replace function public.clear_tor_import_data ()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  delete from public.tor_events;
  delete from public.uploads where dataset = 'tor';
end;
$$;

create table if not exists public.exterior_alarm_events (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads (id) on delete set null,
  department_id uuid references public.lookup_values (id) on delete set null,
  functional_location_id uuid references public.lookup_values (id) on delete set null,
  machine_id uuid references public.lookup_values (id) on delete set null,
  alarm_fault_id uuid references public.lookup_values (id) on delete set null,
  root_cause_id uuid references public.lookup_values (id) on delete set null,
  symptoms text,
  recovery_action text,
  row_hash text not null,
  created_at timestamptz not null default now(),
  constraint exterior_alarm_events_row_hash_key unique (row_hash)
);

create index if not exists exterior_alarm_events_upload_id_idx on public.exterior_alarm_events (upload_id);
create index if not exists exterior_alarm_events_created_at_idx on public.exterior_alarm_events (created_at);

create table if not exists public.supervisor_ot_entries (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads (id) on delete set null,
  name_id uuid references public.lookup_values (id) on delete set null,
  work_date date,
  hours numeric,
  volunteered_mandated_id uuid references public.lookup_values (id) on delete set null,
  entered_at timestamptz,
  row_hash text not null,
  created_at timestamptz not null default now(),
  constraint supervisor_ot_entries_row_hash_key unique (row_hash)
);

create index if not exists supervisor_ot_entries_upload_id_idx on public.supervisor_ot_entries (upload_id);
create index if not exists supervisor_ot_entries_work_date_idx on public.supervisor_ot_entries (work_date);

create or replace view public.v_exterior_alarms_flat as
select
  e.id,
  e.upload_id,
  e.symptoms,
  e.recovery_action,
  e.row_hash,
  e.created_at,
  d.label as department,
  fl.label as functional_location,
  m.label as machine,
  af.label as alarm_fault,
  rc.label as root_cause,
  e.department_id,
  e.functional_location_id,
  e.machine_id,
  e.alarm_fault_id,
  e.root_cause_id
from public.exterior_alarm_events e
  left join public.lookup_values d on d.id = e.department_id
  left join public.lookup_values fl on fl.id = e.functional_location_id
  left join public.lookup_values m on m.id = e.machine_id
  left join public.lookup_values af on af.id = e.alarm_fault_id
  left join public.lookup_values rc on rc.id = e.root_cause_id;

create or replace view public.v_supervisor_ot_flat as
select
  s.id,
  s.upload_id,
  s.work_date,
  s.hours,
  s.entered_at,
  s.row_hash,
  s.created_at,
  n.label as employee_name,
  vm.label as volunteered_mandated,
  s.name_id,
  s.volunteered_mandated_id
from public.supervisor_ot_entries s
  left join public.lookup_values n on n.id = s.name_id
  left join public.lookup_values vm on vm.id = s.volunteered_mandated_id;

grant select on public.v_exterior_alarms_flat to postgres, anon, authenticated, service_role;
grant select on public.v_supervisor_ot_flat to postgres, anon, authenticated, service_role;

alter table if exists public.exterior_alarm_events disable row level security;
alter table if exists public.supervisor_ot_entries disable row level security;

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on table public.exterior_alarm_events to postgres, service_role;
grant all on table public.supervisor_ot_entries to postgres, service_role;
grant select, insert, update, delete on table public.exterior_alarm_events to anon, authenticated;
grant select, insert, update, delete on table public.supervisor_ot_entries to anon, authenticated;

create or replace function public.clear_exterior_alarm_import_data ()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  delete from public.exterior_alarm_events;
  delete from public.uploads where dataset = 'exterior_alarms';
end;
$$;

create or replace function public.clear_supervisor_ot_import_data ()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  delete from public.supervisor_ot_entries;
  delete from public.uploads where dataset = 'supervisor_ot';
end;
$$;

revoke all on function public.clear_exterior_alarm_import_data () from public;
revoke all on function public.clear_supervisor_ot_import_data () from public;
grant execute on function public.clear_exterior_alarm_import_data () to service_role;
grant execute on function public.clear_supervisor_ot_import_data () to service_role;

comment on table public.exterior_alarm_events is 'Rows from Exterior Alarms & Faults workbook, sheet Exterior.';
comment on table public.supervisor_ot_entries is 'Rows from Supervisor Overtime Tracker, sheet Data.';
comment on column public.uploads.dataset is 'tor | exterior_alarms | supervisor_ot';
