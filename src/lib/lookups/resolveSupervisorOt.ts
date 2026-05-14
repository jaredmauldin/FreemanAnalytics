import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupervisorOtInput } from "@/lib/supervisorOt/types";
import { SUPERVISOR_OT_LOOKUP_CATEGORY } from "@/lib/lookups/categories";
import { resolveLookupId } from "@/lib/lookups/resolve";

export type SupervisorOtDbInsert = {
  upload_id: string | null;
  name_id: string | null;
  work_date: string | null;
  hours: number | null;
  volunteered_mandated_id: string | null;
  entered_at: string | null;
  row_hash: string;
};

export async function mapSupervisorOtInputToDbRow(
  supabase: SupabaseClient,
  row: SupervisorOtInput,
  uploadId: string | null,
  rowHash: string,
  cache: Map<string, string>,
): Promise<SupervisorOtDbInsert> {
  return {
    upload_id: uploadId,
    name_id: await resolveLookupId(supabase, SUPERVISOR_OT_LOOKUP_CATEGORY.supervisor_ot_name, row.employee_name, cache),
    work_date: row.work_date,
    hours: row.hours,
    volunteered_mandated_id: await resolveLookupId(
      supabase,
      SUPERVISOR_OT_LOOKUP_CATEGORY.supervisor_ot_mv,
      row.volunteered_mandated,
      cache,
    ),
    entered_at: row.entered_at,
    row_hash: rowHash,
  };
}
