import { createHash } from "node:crypto";
import type { ExteriorAlarmInput } from "./types";

export function exteriorRowHash(row: ExteriorAlarmInput): string {
  const payload = {
    department: row.department,
    functional_location: row.functional_location,
    machine: row.machine,
    alarm_fault: row.alarm_fault,
    symptoms: row.symptoms,
    recovery_action: row.recovery_action,
    root_cause: row.root_cause,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function dedupeExteriorRows(rows: ExteriorAlarmInput[]): ExteriorAlarmInput[] {
  const map = new Map<string, ExteriorAlarmInput>();
  for (const r of rows) {
    map.set(exteriorRowHash(r), r);
  }
  return [...map.values()];
}
