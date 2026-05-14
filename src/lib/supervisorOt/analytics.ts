import { z } from "zod";

export const supervisorOtAnalyticsQuerySchema = z.object({
  uploadId: z.union([z.literal("all"), z.string().uuid()]),
  employeeName: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type SupervisorOtFlatRow = {
  employee_name: string | null;
  work_date: string | null;
  hours: number | null;
  volunteered_mandated: string | null;
  entered_at: string | null;
};

export type SupervisorOtAnalyticsPayload = {
  uploadScope: "all" | string;
  filters: z.infer<typeof supervisorOtAnalyticsQuerySchema>;
  kpis: { entryCount: number; totalHours: number };
  byEmployee: { name: string; hours: number; count: number }[];
  byVolunteeredMandated: { key: string; hours: number; count: number }[];
  byMonth: { key: string; label: string; hours: number; count: number }[];
  filterOptions: { employees: string[] };
};

function monthKey(dateStr: string | null): { key: string; label: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const label = d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return { key, label };
}

export function buildSupervisorOtAnalytics(
  uploadScope: "all" | string,
  filters: z.infer<typeof supervisorOtAnalyticsQuerySchema>,
  rows: SupervisorOtFlatRow[],
  filterOptions?: { employees: string[] },
): SupervisorOtAnalyticsPayload {
  let filtered = rows;
  if (filters.employeeName) {
    filtered = filtered.filter((r) => r.employee_name === filters.employeeName);
  }
  if (filters.from) {
    filtered = filtered.filter((r) => (r.work_date ?? "") >= filters.from!);
  }
  if (filters.to) {
    filtered = filtered.filter((r) => (r.work_date ?? "") <= filters.to!);
  }

  const totalHours = filtered.reduce((a, r) => a + (Number(r.hours) || 0), 0);

  const empMap = new Map<string, { hours: number; count: number }>();
  for (const r of filtered) {
    const n = r.employee_name ?? "";
    if (!n) continue;
    const cur = empMap.get(n) ?? { hours: 0, count: 0 };
    cur.hours += Number(r.hours) || 0;
    cur.count += 1;
    empMap.set(n, cur);
  }
  const byEmployee = [...empMap.entries()]
    .map(([name, v]) => ({ name, hours: v.hours, count: v.count }))
    .sort((a, b) => b.hours - a.hours);

  const vmMap = new Map<string, { hours: number; count: number }>();
  for (const r of filtered) {
    const k = r.volunteered_mandated ?? "—";
    const cur = vmMap.get(k) ?? { hours: 0, count: 0 };
    cur.hours += Number(r.hours) || 0;
    cur.count += 1;
    vmMap.set(k, cur);
  }
  const byVolunteeredMandated = [...vmMap.entries()]
    .map(([key, v]) => ({ key, hours: v.hours, count: v.count }))
    .sort((a, b) => b.hours - a.hours);

  const moMap = new Map<string, { hours: number; count: number; label: string }>();
  for (const r of filtered) {
    const mk = monthKey(r.work_date);
    if (!mk) continue;
    const cur = moMap.get(mk.key) ?? { hours: 0, count: 0, label: mk.label };
    cur.hours += Number(r.hours) || 0;
    cur.count += 1;
    moMap.set(mk.key, cur);
  }
  const byMonth = [...moMap.entries()]
    .map(([key, v]) => ({ key, label: v.label, hours: v.hours, count: v.count }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const employees =
    filterOptions?.employees ??
    ([...new Set(rows.map((r) => r.employee_name).filter(Boolean))] as string[]).sort();

  return {
    uploadScope,
    filters,
    kpis: { entryCount: filtered.length, totalHours },
    byEmployee,
    byVolunteeredMandated,
    byMonth,
    filterOptions: { employees },
  };
}
