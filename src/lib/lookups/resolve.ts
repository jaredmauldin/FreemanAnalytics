import type { SupabaseClient } from "@supabase/supabase-js";
import type { TorEventInput } from "@/lib/tor/types";
import { LOOKUP_CATEGORY } from "@/lib/lookups/categories";

export { LOOKUP_CATEGORY } from "@/lib/lookups/categories";

const cacheKey = (category: string, label: string) => `${category}::${label}`;

/**
 * Resolves a display label to lookup_values.id, creating the row if needed.
 */
export async function resolveLookupId(
  supabase: SupabaseClient,
  category: string,
  label: string | null | undefined,
  cache: Map<string, string>,
): Promise<string | null> {
  if (label === null || label === undefined) return null;
  const trimmed = String(label).trim();
  if (!trimmed) return null;

  const ck = cacheKey(category, trimmed);
  const hit = cache.get(ck);
  if (hit) return hit;

  const { data: found, error: selErr } = await supabase
    .from("lookup_values")
    .select("id")
    .eq("category", category)
    .eq("label", trimmed)
    .maybeSingle();

  if (selErr) throw new Error(selErr.message);
  if (found?.id) {
    cache.set(ck, found.id as string);
    return found.id as string;
  }

  const { data: inserted, error: insErr } = await supabase
    .from("lookup_values")
    .insert({ category, label: trimmed })
    .select("id")
    .single();

  if (insErr) {
    const { data: again } = await supabase
      .from("lookup_values")
      .select("id")
      .eq("category", category)
      .eq("label", trimmed)
      .maybeSingle();
    if (again?.id) {
      cache.set(ck, again.id as string);
      return again.id as string;
    }
    throw new Error(insErr.message);
  }

  const id = inserted?.id as string;
  cache.set(ck, id);
  return id;
}

export type TorDbInsert = {
  upload_id: string | null;
  work_order_number: number | null;
  equipment_location_id: string | null;
  equipment_type_id: string | null;
  specific_equipment_id: string | null;
  malfunction_type_id: string | null;
  failure_mode_id: string | null;
  failure_cause_id: string | null;
  error_message: string | null;
  symptoms: string | null;
  corrective_measures: string | null;
  pdt_edt_id: string | null;
  dt_min: number | null;
  shift_id: string | null;
  month: number | null;
  date_of_error: string | null;
  technicians_name: string | null;
  week_number: number | null;
  num_pdt_calls: number | null;
  total_pdt_min: number | null;
  mttr_min: number | null;
  mtbf_min: number | null;
  row_hash: string;
};

export async function mapTorInputToDbRow(
  supabase: SupabaseClient,
  row: TorEventInput,
  uploadId: string | null,
  rowHash: string,
  cache: Map<string, string>,
): Promise<TorDbInsert> {
  return {
    upload_id: uploadId,
    work_order_number: row.work_order_number,
    equipment_location_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.equipment_location, row.equipment_location, cache),
    equipment_type_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.equipment_type, row.equipment_type, cache),
    specific_equipment_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.specific_equipment, row.specific_equipment, cache),
    malfunction_type_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.malfunction_type, row.malfunction_type, cache),
    failure_mode_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.failure_mode, row.failure_modes, cache),
    failure_cause_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.failure_cause, row.failure_causes, cache),
    error_message: row.error_message,
    symptoms: row.symptoms,
    corrective_measures: row.corrective_measures,
    pdt_edt_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.pdt_edt, row.pdt_edt, cache),
    dt_min: row.dt_min,
    shift_id: await resolveLookupId(supabase, LOOKUP_CATEGORY.shift, row.shift, cache),
    month: row.month,
    date_of_error: row.date_of_error,
    technicians_name: row.technicians_name,
    week_number: row.week_number,
    num_pdt_calls: row.num_pdt_calls,
    total_pdt_min: row.total_pdt_min,
    mttr_min: row.mttr_min,
    mtbf_min: row.mtbf_min,
    row_hash: rowHash,
  };
}
