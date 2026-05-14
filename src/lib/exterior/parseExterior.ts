import * as XLSX from "xlsx";
import type { ExteriorAlarmInput } from "./types";

const SHEET = "Exterior";

const EXPECTED = [
  "Department",
  "Functional Location",
  "Machine",
  "Alarm/Fault",
  "Symptoms",
  "Recovery Action",
  "Root Cause",
] as const;

function normHeader(v: unknown): string {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function cellStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function rowToInput(row: unknown[]): ExteriorAlarmInput | null {
  const department = cellStr(row[0]);
  const functional_location = cellStr(row[1]);
  const machine = cellStr(row[2]);
  const alarm_fault = cellStr(row[3]);
  const symptoms = cellStr(row[4]);
  const recovery_action = cellStr(row[5]);
  const root_cause = cellStr(row[6]);
  if (!alarm_fault && !machine && !department && !functional_location) return null;
  return {
    department,
    functional_location,
    machine,
    alarm_fault,
    symptoms,
    recovery_action,
    root_cause,
  };
}

export async function parseExteriorSheet(buffer: ArrayBuffer): Promise<ExteriorAlarmInput[]> {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true, cellNF: false, cellText: false });
  const sh = wb.Sheets[SHEET];
  if (!sh) {
    throw new Error(`Workbook must contain a sheet named "${SHEET}".`);
  }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sh, { header: 1, defval: null, raw: true });
  if (!rows.length) throw new Error(`Sheet "${SHEET}" is empty.`);

  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const h = r.slice(0, EXPECTED.length).map(normHeader);
    if (h.length < EXPECTED.length) continue;
    let ok = true;
    for (let j = 0; j < EXPECTED.length; j++) {
      if (h[j] !== EXPECTED[j]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) {
    throw new Error(`Sheet "${SHEET}" must include header row: ${EXPECTED.join(", ")}`);
  }

  const out: ExteriorAlarmInput[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const input = rowToInput(r);
    if (input) out.push(input);
  }
  return out;
}
