-- Normalized lookup_values + tor_events FK columns + flat view for reads/search/analytics.
-- Run once after 001 (002 permissions optional). Self-contained: adds row_hash if missing (003 optional).
-- Backs up text columns into lookups then drops text columns.

create table if not exists public.lookup_values (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  label text not null,
  created_at timestamptz not null default now(),
  constraint lookup_values_category_label_key unique (category, label)
);

create index if not exists lookup_values_category_idx on public.lookup_values (category);

-- FK columns (nullable until backfill)
alter table public.tor_events
  add column if not exists equipment_location_id uuid references public.lookup_values (id) on delete set null,
  add column if not exists equipment_type_id uuid references public.lookup_values (id) on delete set null,
  add column if not exists specific_equipment_id uuid references public.lookup_values (id) on delete set null,
  add column if not exists malfunction_type_id uuid references public.lookup_values (id) on delete set null,
  add column if not exists failure_mode_id uuid references public.lookup_values (id) on delete set null,
  add column if not exists failure_cause_id uuid references public.lookup_values (id) on delete set null,
  add column if not exists pdt_edt_id uuid references public.lookup_values (id) on delete set null,
  add column if not exists shift_id uuid references public.lookup_values (id) on delete set null;

-- row_hash is required for upserts; migration 003 may not have run — ensure column + index exist.
alter table public.tor_events add column if not exists row_hash text;

create unique index if not exists tor_events_row_hash_uidx on public.tor_events (row_hash);

-- Backfill from legacy text columns when present
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tor_events'
      and column_name = 'equipment_location'
  ) then
    insert into public.lookup_values (category, label)
    select distinct 'equipment_location', trim(equipment_location)
    from public.tor_events
    where equipment_location is not null
      and trim(equipment_location) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set equipment_location_id = lv.id
    from public.lookup_values lv
    where lv.category = 'equipment_location'
      and lv.label = trim(e.equipment_location);

    insert into public.lookup_values (category, label)
    select distinct 'equipment_type', trim(equipment_type)
    from public.tor_events
    where equipment_type is not null
      and trim(equipment_type) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set equipment_type_id = lv.id
    from public.lookup_values lv
    where lv.category = 'equipment_type'
      and lv.label = trim(e.equipment_type);

    insert into public.lookup_values (category, label)
    select distinct 'specific_equipment', trim(specific_equipment)
    from public.tor_events
    where specific_equipment is not null
      and trim(specific_equipment) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set specific_equipment_id = lv.id
    from public.lookup_values lv
    where lv.category = 'specific_equipment'
      and lv.label = trim(e.specific_equipment);

    insert into public.lookup_values (category, label)
    select distinct 'malfunction_type', trim(malfunction_type)
    from public.tor_events
    where malfunction_type is not null
      and trim(malfunction_type) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set malfunction_type_id = lv.id
    from public.lookup_values lv
    where lv.category = 'malfunction_type'
      and lv.label = trim(e.malfunction_type);

    insert into public.lookup_values (category, label)
    select distinct 'failure_mode', trim(failure_modes)
    from public.tor_events
    where failure_modes is not null
      and trim(failure_modes) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set failure_mode_id = lv.id
    from public.lookup_values lv
    where lv.category = 'failure_mode'
      and lv.label = trim(e.failure_modes);

    insert into public.lookup_values (category, label)
    select distinct 'failure_cause', trim(failure_causes)
    from public.tor_events
    where failure_causes is not null
      and trim(failure_causes) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set failure_cause_id = lv.id
    from public.lookup_values lv
    where lv.category = 'failure_cause'
      and lv.label = trim(e.failure_causes);

    insert into public.lookup_values (category, label)
    select distinct 'pdt_edt', trim(pdt_edt)
    from public.tor_events
    where pdt_edt is not null
      and trim(pdt_edt) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set pdt_edt_id = lv.id
    from public.lookup_values lv
    where lv.category = 'pdt_edt'
      and lv.label = trim(e.pdt_edt);

    insert into public.lookup_values (category, label)
    select distinct 'shift', trim(shift)
    from public.tor_events
    where shift is not null
      and trim(shift) <> ''
    on conflict (category, label) do nothing;

    update public.tor_events e
    set shift_id = lv.id
    from public.lookup_values lv
    where lv.category = 'shift'
      and lv.label = trim(e.shift);

    alter table public.tor_events drop column if exists equipment_location;
    alter table public.tor_events drop column if exists equipment_type;
    alter table public.tor_events drop column if exists specific_equipment;
    alter table public.tor_events drop column if exists malfunction_type;
    alter table public.tor_events drop column if exists failure_modes;
    alter table public.tor_events drop column if exists failure_causes;
    alter table public.tor_events drop column if exists pdt_edt;
    alter table public.tor_events drop column if exists shift;
  end if;
end $$;

alter table public.tor_events alter column upload_id drop not null;

drop index if exists public.tor_events_equipment_type_idx;
create index if not exists tor_events_equipment_type_id_idx on public.tor_events (equipment_type_id);

comment on table public.lookup_values is 'Normalized dropdown labels per category (TOR + grid).';

create or replace view public.v_tor_events_flat as
select
  e.id,
  e.upload_id,
  e.work_order_number,
  e.error_message,
  e.symptoms,
  e.corrective_measures,
  e.dt_min,
  e.month,
  e.date_of_error,
  e.technicians_name,
  e.week_number,
  e.num_pdt_calls,
  e.total_pdt_min,
  e.mttr_min,
  e.mtbf_min,
  e.row_hash,
  e.created_at,
  el.label as equipment_location,
  et.label as equipment_type,
  se.label as specific_equipment,
  mt.label as malfunction_type,
  fm.label as failure_modes,
  fc.label as failure_causes,
  pe.label as pdt_edt,
  sh.label as shift,
  e.equipment_location_id,
  e.equipment_type_id,
  e.specific_equipment_id,
  e.malfunction_type_id,
  e.failure_mode_id,
  e.failure_cause_id,
  e.pdt_edt_id,
  e.shift_id
from public.tor_events e
  left join public.lookup_values el on el.id = e.equipment_location_id
  left join public.lookup_values et on et.id = e.equipment_type_id
  left join public.lookup_values se on se.id = e.specific_equipment_id
  left join public.lookup_values mt on mt.id = e.malfunction_type_id
  left join public.lookup_values fm on fm.id = e.failure_mode_id
  left join public.lookup_values fc on fc.id = e.failure_cause_id
  left join public.lookup_values pe on pe.id = e.pdt_edt_id
  left join public.lookup_values sh on sh.id = e.shift_id;

grant select on public.v_tor_events_flat to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on public.lookup_values to postgres, anon, authenticated, service_role;

alter table public.lookup_values enable row level security;
