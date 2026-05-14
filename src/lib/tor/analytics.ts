import { z } from "zod";

export const analyticsQuerySchema = z.object({
  uploadId: z.union([z.literal("all"), z.string().uuid()]),
  shift: z.string().optional(),
  equipmentType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  /** Chart drill: exact specific_equipment match */
  specificEquipment: z.string().optional(),
  /** Chart drill: exact malfunction_type match */
  malfunctionType: z.string().optional(),
  /** Chart drill: PDT/EDT bucket label */
  pdtEdt: z.string().optional(),
  /** Chart drill: calendar month YYYY-MM (UTC) */
  monthKey: z.string().optional(),
});

export type TorEventRow = {
  dt_min: number | null;
  shift: string | null;
  equipment_type: string | null;
  specific_equipment: string | null;
  malfunction_type: string | null;
  pdt_edt: string | null;
  month: number | null;
  date_of_error: string | null;
  mttr_min: number | null;
  mtbf_min: number | null;
};

export type AnalyticsPayload = {
  uploadScope: "all" | string;
  filters: z.infer<typeof analyticsQuerySchema>;
  kpis: {
    eventCount: number;
    totalDtMin: number;
    avgMttrMin: number | null;
    avgMtbfMin: number | null;
  };
  bySpecificEquipment: { name: string; dtMin: number; count: number }[];
  byMalfunction: { name: string; dtMin: number; count: number }[];
  byMonth: { key: string; label: string; dtMin: number; count: number }[];
  pdtVsEdt: { key: string; dtMin: number; count: number }[];
  byShift: { shift: string; dtMin: number; count: number }[];
  byEquipmentType: { type: string; dtMin: number; count: number }[];
  filterOptions: {
    shifts: string[];
    equipmentTypes: string[];
  };
};

function sumDt(rows: { dt_min: number | null }[]): number {
  return rows.reduce((a, r) => a + (r.dt_min ?? 0), 0);
}

function bucketSum(
  rows: TorEventRow[],
  keyFn: (r: TorEventRow) => string,
  top = 12,
): { name: string; dtMin: number; count: number }[] {
  const map = new Map<string, { dtMin: number; count: number }>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    const cur = map.get(k) ?? { dtMin: 0, count: 0 };
    cur.dtMin += r.dt_min ?? 0;
    cur.count += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, dtMin: v.dtMin, count: v.count }))
    .sort((a, b) => b.dtMin - a.dtMin)
    .slice(0, top);
}

function monthLabel(m: number | null, dateStr: string | null): { key: string; label: string } | null {
  if (dateStr) {
    const d = new Date(dateStr + "T12:00:00Z");
    if (!Number.isNaN(d.getTime())) {
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      return { key, label };
    }
  }
  if (m !== null && Number.isFinite(m)) {
    return { key: `m-${m}`, label: `Month ${m}` };
  }
  return null;
}

export function buildAnalytics(
  uploadScope: "all" | string,
  filters: z.infer<typeof analyticsQuerySchema>,
  rows: TorEventRow[],
  filterOptions?: { shifts: string[]; equipmentTypes: string[] },
): AnalyticsPayload {
  const shifts = filterOptions?.shifts ?? ([...new Set(rows.map((r) => r.shift).filter(Boolean))] as string[]);
  const equipmentTypes =
    filterOptions?.equipmentTypes ??
    ([...new Set(rows.map((r) => r.equipment_type).filter(Boolean))] as string[]);
  shifts.sort();
  equipmentTypes.sort();

  const totalDt = sumDt(rows);
  const mttrVals = rows.map((r) => r.mttr_min).filter((v): v is number => v !== null && Number.isFinite(v));
  const mtbfVals = rows.map((r) => r.mtbf_min).filter((v): v is number => v !== null && Number.isFinite(v));
  const avgMttr = mttrVals.length ? mttrVals.reduce((a, b) => a + b, 0) / mttrVals.length : null;
  const avgMtbf = mtbfVals.length ? mtbfVals.reduce((a, b) => a + b, 0) / mtbfVals.length : null;

  const bySpecific = bucketSum(rows, (r) => r.specific_equipment ?? "", 15).filter((x) => x.name);
  const byMal = bucketSum(rows, (r) => r.malfunction_type ?? "", 15).filter((x) => x.name);

  const monthMap = new Map<string, { dtMin: number; count: number; label: string }>();
  for (const r of rows) {
    const ml = monthLabel(r.month, r.date_of_error);
    if (!ml) continue;
    const cur = monthMap.get(ml.key) ?? { dtMin: 0, count: 0, label: ml.label };
    cur.dtMin += r.dt_min ?? 0;
    cur.count += 1;
    cur.label = ml.label;
    monthMap.set(ml.key, cur);
  }
  const byMonth = [...monthMap.entries()]
    .map(([key, v]) => ({ key, label: v.label, dtMin: v.dtMin, count: v.count }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const pdtMap = new Map<string, { dtMin: number; count: number }>();
  for (const r of rows) {
    const k = (r.pdt_edt ?? "Unknown").trim() || "Unknown";
    const cur = pdtMap.get(k) ?? { dtMin: 0, count: 0 };
    cur.dtMin += r.dt_min ?? 0;
    cur.count += 1;
    pdtMap.set(k, cur);
  }
  const pdtVsEdt = [...pdtMap.entries()].map(([key, v]) => ({ key, dtMin: v.dtMin, count: v.count }));

  const shiftMap = new Map<string, { dtMin: number; count: number }>();
  for (const r of rows) {
    const s = (r.shift ?? "Unknown").trim() || "Unknown";
    const cur = shiftMap.get(s) ?? { dtMin: 0, count: 0 };
    cur.dtMin += r.dt_min ?? 0;
    cur.count += 1;
    shiftMap.set(s, cur);
  }
  const byShift = [...shiftMap.entries()]
    .map(([shift, v]) => ({ shift, dtMin: v.dtMin, count: v.count }))
    .sort((a, b) => b.dtMin - a.dtMin);

  const eqMap = new Map<string, { dtMin: number; count: number }>();
  for (const r of rows) {
    const t = (r.equipment_type ?? "Unknown").trim() || "Unknown";
    const cur = eqMap.get(t) ?? { dtMin: 0, count: 0 };
    cur.dtMin += r.dt_min ?? 0;
    cur.count += 1;
    eqMap.set(t, cur);
  }
  const byEquipmentType = [...eqMap.entries()]
    .map(([type, v]) => ({ type, dtMin: v.dtMin, count: v.count }))
    .sort((a, b) => b.dtMin - a.dtMin);

  return {
    uploadScope,
    filters,
    kpis: {
      eventCount: rows.length,
      totalDtMin: totalDt,
      avgMttrMin: avgMttr,
      avgMtbfMin: avgMtbf,
    },
    bySpecificEquipment: bySpecific,
    byMalfunction: byMal,
    byMonth,
    pdtVsEdt,
    byShift,
    byEquipmentType,
    filterOptions: { shifts, equipmentTypes },
  };
}
