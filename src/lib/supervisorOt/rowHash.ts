import { createHash } from "node:crypto";
import type { SupervisorOtInput } from "./types";

export function supervisorOtRowHash(row: SupervisorOtInput): string {
  const payload = {
    employee_name: row.employee_name,
    work_date: row.work_date,
    hours: row.hours,
    volunteered_mandated: row.volunteered_mandated,
    entered_at: row.entered_at,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function dedupeSupervisorOtRows(rows: SupervisorOtInput[]): SupervisorOtInput[] {
  const map = new Map<string, SupervisorOtInput>();
  for (const r of rows) {
    map.set(supervisorOtRowHash(r), r);
  }
  return [...map.values()];
}
