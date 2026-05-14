import { z } from "zod";

export const exteriorAnalyticsQuerySchema = z.object({
  uploadId: z.union([z.literal("all"), z.string().uuid()]),
  department: z.string().optional(),
  functionalLocation: z.string().optional(),
  machine: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  alarmFault: z.string().optional(),
  rootCause: z.string().optional(),
});

export type ExteriorFlatRow = {
  department: string | null;
  functional_location: string | null;
  machine: string | null;
  alarm_fault: string | null;
  root_cause: string | null;
  created_at: string | null;
};

export type ExteriorAnalyticsPayload = {
  uploadScope: "all" | string;
  filters: z.infer<typeof exteriorAnalyticsQuerySchema>;
  kpis: { eventCount: number };
  byDepartment: { name: string; count: number }[];
  byAlarmFault: { name: string; count: number }[];
  byRootCause: { name: string; count: number }[];
  byMachine: { name: string; count: number }[];
  filterOptions: { departments: string[]; functionalLocations: string[]; machines: string[] };
};

function bucketCount(rows: ExteriorFlatRow[], keyFn: (r: ExteriorFlatRow) => string, top = 15) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

export function buildExteriorAnalytics(
  uploadScope: "all" | string,
  filters: z.infer<typeof exteriorAnalyticsQuerySchema>,
  rows: ExteriorFlatRow[],
  filterOptions?: { departments: string[]; functionalLocations: string[]; machines: string[] },
): ExteriorAnalyticsPayload {
  let filtered = rows;
  if (filters.department) {
    filtered = filtered.filter((r) => r.department === filters.department);
  }
  if (filters.functionalLocation) {
    filtered = filtered.filter((r) => (r.functional_location ?? "") === filters.functionalLocation);
  }
  if (filters.machine) {
    filtered = filtered.filter((r) => (r.machine ?? "") === filters.machine);
  }
  if (filters.alarmFault) {
    filtered = filtered.filter((r) => (r.alarm_fault ?? "") === filters.alarmFault);
  }
  if (filters.rootCause) {
    filtered = filtered.filter((r) => (r.root_cause ?? "") === filters.rootCause);
  }
  if (filters.from) {
    filtered = filtered.filter((r) => (r.created_at ?? "").slice(0, 10) >= filters.from!);
  }
  if (filters.to) {
    filtered = filtered.filter((r) => (r.created_at ?? "").slice(0, 10) <= filters.to!);
  }

  const departments =
    filterOptions?.departments ??
    ([...new Set(rows.map((r) => r.department).filter(Boolean))] as string[]).sort();
  const functionalLocations =
    filterOptions?.functionalLocations ??
    ([...new Set(rows.map((r) => r.functional_location).filter(Boolean))] as string[]).sort();
  const machines =
    filterOptions?.machines ?? ([...new Set(rows.map((r) => r.machine).filter(Boolean))] as string[]).sort();

  return {
    uploadScope,
    filters,
    kpis: { eventCount: filtered.length },
    byDepartment: bucketCount(filtered, (r) => r.department ?? ""),
    byAlarmFault: bucketCount(filtered, (r) => r.alarm_fault ?? ""),
    byRootCause: bucketCount(filtered, (r) => r.root_cause ?? ""),
    byMachine: bucketCount(filtered, (r) => r.machine ?? ""),
    filterOptions: { departments, functionalLocations, machines },
  };
}
