import { createHash } from "node:crypto";
import type { TorEventInput } from "./types";

/** Canonical fingerprint so identical TOR rows upsert instead of duplicating. */
export function torRowHash(row: TorEventInput): string {
  const payload = {
    work_order_number: row.work_order_number,
    equipment_location: row.equipment_location,
    equipment_type: row.equipment_type,
    specific_equipment: row.specific_equipment,
    malfunction_type: row.malfunction_type,
    failure_modes: row.failure_modes,
    failure_causes: row.failure_causes,
    error_message: row.error_message,
    symptoms: row.symptoms,
    corrective_measures: row.corrective_measures,
    pdt_edt: row.pdt_edt,
    dt_min: row.dt_min,
    shift: row.shift,
    month: row.month,
    date_of_error: row.date_of_error,
    technicians_name: row.technicians_name,
    week_number: row.week_number,
    num_pdt_calls: row.num_pdt_calls,
    total_pdt_min: row.total_pdt_min,
    mttr_min: row.mttr_min,
    mtbf_min: row.mtbf_min,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/** Last row wins for identical fingerprints within one file. */
export function dedupeTorRows(rows: TorEventInput[]): TorEventInput[] {
  const map = new Map<string, TorEventInput>();
  for (const r of rows) {
    map.set(torRowHash(r), r);
  }
  return [...map.values()];
}
