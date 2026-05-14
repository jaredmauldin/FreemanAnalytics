import * as XLSX from "xlsx";
import type { SupervisorOtInput } from "./types";

const SHEET = "Data";

function stripLabel(s: string): string {
  return s.replace(/:\s*$/, "").trim();
}

function cellStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  return null;
}

function cellNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** ISO date yyyy-mm-dd for DB */
function cellToWorkDate(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + v * 86400000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

/** ISO timestamptz string */
function cellToEnteredAt(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + v * 86400000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

export async function parseSupervisorOtSheet(buffer: ArrayBuffer): Promise<SupervisorOtInput[]> {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true, cellNF: false, cellText: false });
  const sh = wb.Sheets[SHEET];
  if (!sh) {
    throw new Error(`Workbook must contain a sheet named "${SHEET}".`);
  }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sh, { header: 1, defval: null, raw: true });
  if (rows.length < 2) throw new Error(`Sheet "${SHEET}" has no data rows.`);

  const header = rows[0];
  if (!Array.isArray(header)) throw new Error("Invalid header row.");
  const h0 = stripLabel(String(header[0] ?? ""));
  const h1 = stripLabel(String(header[1] ?? ""));
  const h2 = stripLabel(String(header[2] ?? ""));
  const h3 = stripLabel(String(header[3] ?? ""));
  if (h0 !== "Name" || h1 !== "Date" || h2 !== "Hours" || h3 !== "Volunteered/Mandated") {
    throw new Error(`Sheet "${SHEET}" must have columns: Name, Date, Hours, Volunteered/Mandated, TimeStamp`);
  }

  const out: SupervisorOtInput[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const employee_name = cellStr(r[0]);
    if (!employee_name) continue;
    const work_date = cellToWorkDate(r[1]);
    const hours = cellNum(r[2]);
    const volunteered_mandated = cellStr(r[3]);
    const entered_at = cellToEnteredAt(r[4]);
    out.push({
      employee_name,
      work_date,
      hours,
      volunteered_mandated,
      entered_at,
    });
  }
  return out;
}
