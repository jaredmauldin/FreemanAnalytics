import * as XLSX from "xlsx";
import type { TorEventInput } from "./types";

const HEADER_ROW_INDEX = 3;
const DATA_START_INDEX = 4;

const EXPECTED_HEADERS = [
  "Work Order #",
  "Equipment Location",
  "Equipment Type",
  "Specific Equipment",
  "Malfunction Type",
  "Failure Modes",
  "Failure Causes",
  "Error Message",
  "Symptoms",
  "Corrective Measures",
  "PDT/EDT",
  "DT: (min)",
  "Shift",
  "Month",
  "Date of Error",
  "Technician's Name",
  "Week Number",
  "# of PDT Calls",
  "Total PDT (min)",
  "MTTR (min)",
  "MTBF (min)",
] as const;

function cellToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return null;
  return null;
}

function cellToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function cellToInt(value: unknown): number | null {
  const n = cellToNumber(value);
  if (n === null) return null;
  return Math.round(n);
}

function cellToDateString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + value * 86400000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return null;
    const parsed = new Date(t);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function cellToBigInt(value: unknown): number | null {
  return cellToInt(value);
}

function headersMatch(headerRow: unknown[]): boolean {
  if (!headerRow || headerRow.length < EXPECTED_HEADERS.length) return false;
  for (let c = 0; c < EXPECTED_HEADERS.length; c++) {
    const h = cellToString(headerRow[c]);
    const expected = EXPECTED_HEADERS[c];
    if ((h ?? "").toLowerCase() !== expected.toLowerCase()) {
      return false;
    }
  }
  return true;
}

function getCell(row: unknown[] | undefined, colIndex: number): unknown {
  if (!row) return null;
  const v = row[colIndex];
  return v === undefined ? null : v;
}

export async function parseTorSheet(buffer: ArrayBuffer): Promise<TorEventInput[]> {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets["TOR"];
  if (!ws) {
    throw new Error('Workbook must contain a sheet named "TOR".');
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    raw: true,
  });

  const headerRow = matrix[HEADER_ROW_INDEX];
  if (!headersMatch(headerRow ?? [])) {
    throw new Error(
      `Row ${HEADER_ROW_INDEX + 1} on sheet "TOR" does not match the expected TOR headers. ` +
        "Export a fresh copy of the plant workbook or adjust the parser.",
    );
  }

  const out: TorEventInput[] = [];
  let emptyRun = 0;
  const maxEmpty = 25;

  for (let r = DATA_START_INDEX; r < matrix.length; r++) {
    const row = matrix[r] as unknown[] | undefined;
    const wo = cellToBigInt(getCell(row, 0));
    const eqLoc = cellToString(getCell(row, 1));
    const dateStr = cellToDateString(getCell(row, 14));

    const rowEmpty = wo === null && eqLoc === null && dateStr === null;
    if (rowEmpty) {
      emptyRun += 1;
      if (emptyRun >= maxEmpty && out.length > 0) break;
      continue;
    }
    emptyRun = 0;

    out.push({
      work_order_number: wo,
      equipment_location: eqLoc,
      equipment_type: cellToString(getCell(row, 2)),
      specific_equipment: cellToString(getCell(row, 3)),
      malfunction_type: cellToString(getCell(row, 4)),
      failure_modes: cellToString(getCell(row, 5)),
      failure_causes: cellToString(getCell(row, 6)),
      error_message: cellToString(getCell(row, 7)),
      symptoms: cellToString(getCell(row, 8)),
      corrective_measures: cellToString(getCell(row, 9)),
      pdt_edt: cellToString(getCell(row, 10)),
      dt_min: cellToNumber(getCell(row, 11)),
      shift: cellToString(getCell(row, 12)),
      month: cellToInt(getCell(row, 13)),
      date_of_error: dateStr,
      technicians_name: cellToString(getCell(row, 15)),
      week_number: cellToInt(getCell(row, 16)),
      num_pdt_calls: cellToInt(getCell(row, 17)),
      total_pdt_min: cellToNumber(getCell(row, 18)),
      mttr_min: cellToNumber(getCell(row, 19)),
      mtbf_min: cellToNumber(getCell(row, 20)),
    });
  }

  return out;
}
