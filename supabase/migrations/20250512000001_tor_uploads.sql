-- TOR injection molding workbook → relational model
-- Run in Supabase SQL editor or via CLI: supabase db push

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  filename text not null,
  row_count integer not null default 0
);

create table if not exists public.tor_events (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.uploads (id) on delete cascade,
  work_order_number bigint,
  equipment_location text,
  equipment_type text,
  specific_equipment text,
  malfunction_type text,
  failure_modes text,
  failure_causes text,
  error_message text,
  symptoms text,
  corrective_measures text,
  pdt_edt text,
  dt_min numeric,
  shift text,
  month integer,
  date_of_error date,
  technicians_name text,
  week_number integer,
  num_pdt_calls integer,
  total_pdt_min numeric,
  mttr_min numeric,
  mtbf_min numeric,
  created_at timestamptz not null default now()
);

create index if not exists tor_events_upload_id_idx on public.tor_events (upload_id);
create index if not exists tor_events_date_idx on public.tor_events (date_of_error);
create index if not exists tor_events_equipment_type_idx on public.tor_events (equipment_type);

comment on table public.uploads is 'One row per .xlsm/.xlsx import.';
comment on table public.tor_events is 'Rows from the TOR sheet (header row 4, data from row 5).';

alter table public.uploads enable row level security;
alter table public.tor_events enable row level security;

-- If inserts fail with "permission denied for table uploads", run the next migration
-- `20250512000002_uploads_fix_permissions.sql` (or disable RLS / add policies yourself).

-- No policies: only the service role (server) can access. Add SELECT policies if you read from the browser with the anon key.
