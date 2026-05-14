import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExteriorAlarmInput } from "@/lib/exterior/types";
import { EXTERIOR_LOOKUP_CATEGORY } from "@/lib/lookups/categories";
import { resolveLookupId } from "@/lib/lookups/resolve";

export type ExteriorDbInsert = {
  upload_id: string | null;
  department_id: string | null;
  functional_location_id: string | null;
  machine_id: string | null;
  alarm_fault_id: string | null;
  root_cause_id: string | null;
  symptoms: string | null;
  recovery_action: string | null;
  row_hash: string;
};

export async function mapExteriorInputToDbRow(
  supabase: SupabaseClient,
  row: ExteriorAlarmInput,
  uploadId: string | null,
  rowHash: string,
  cache: Map<string, string>,
): Promise<ExteriorDbInsert> {
  return {
    upload_id: uploadId,
    department_id: await resolveLookupId(supabase, EXTERIOR_LOOKUP_CATEGORY.ext_department, row.department, cache),
    functional_location_id: await resolveLookupId(
      supabase,
      EXTERIOR_LOOKUP_CATEGORY.ext_functional_location,
      row.functional_location,
      cache,
    ),
    machine_id: await resolveLookupId(supabase, EXTERIOR_LOOKUP_CATEGORY.ext_machine, row.machine, cache),
    alarm_fault_id: await resolveLookupId(supabase, EXTERIOR_LOOKUP_CATEGORY.ext_alarm_fault, row.alarm_fault, cache),
    root_cause_id: await resolveLookupId(supabase, EXTERIOR_LOOKUP_CATEGORY.ext_root_cause, row.root_cause, cache),
    symptoms: row.symptoms,
    recovery_action: row.recovery_action,
    row_hash: rowHash,
  };
}
