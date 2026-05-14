"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsPayload } from "@/lib/tor/analytics";
import { isYearMonthKey, toggleString } from "@/lib/chartCrossFilter";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#eab308", "#ef4444", "#64748b"];
const SELECTED = "#facc15";

function formatInt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function formatDec(n: number | null) {
  if (n === null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n);
}

type Props = {
  uploadScope?: "all" | string;
  /** Bump after import so charts refetch. */
  refreshKey?: number;
};

export function TorDashboard({ uploadScope = "all", refreshKey = 0 }: Props) {
  const [shift, setShift] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [recordMonth, setRecordMonth] = useState("");
  const [equipmentLocation, setEquipmentLocation] = useState("");
  const [failureModes, setFailureModes] = useState("");
  const [failureCauses, setFailureCauses] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [specificEquipment, setSpecificEquipment] = useState("");
  const [malfunctionType, setMalfunctionType] = useState("");
  const [pdtEdt, setPdtEdt] = useState("");
  const [monthKey, setMonthKey] = useState("");

  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("uploadId", uploadScope);
    if (shift) p.set("shift", shift);
    if (equipmentType) p.set("equipmentType", equipmentType);
    if (recordMonth) p.set("recordMonth", recordMonth);
    if (equipmentLocation) p.set("equipmentLocation", equipmentLocation);
    if (failureModes) p.set("failureModes", failureModes);
    if (failureCauses) p.set("failureCauses", failureCauses);
    if (technicianName) p.set("technicianName", technicianName);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (specificEquipment) p.set("specificEquipment", specificEquipment);
    if (malfunctionType) p.set("malfunctionType", malfunctionType);
    if (pdtEdt) p.set("pdtEdt", pdtEdt);
    if (monthKey) p.set("monthKey", monthKey);
    if (refreshKey) p.set("_r", String(refreshKey));
    return p.toString();
  }, [
    uploadScope,
    shift,
    equipmentType,
    recordMonth,
    equipmentLocation,
    failureModes,
    failureCauses,
    technicianName,
    from,
    to,
    specificEquipment,
    malfunctionType,
    pdtEdt,
    monthKey,
    refreshKey,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/analytics?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : res.statusText);
      setData(json as AnalyticsPayload);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  const scopeLabel = uploadScope === "all" ? "All imports" : "This upload";

  const clearAllFilters = useCallback(() => {
    setShift("");
    setEquipmentType("");
    setRecordMonth("");
    setEquipmentLocation("");
    setFailureModes("");
    setFailureCauses("");
    setTechnicianName("");
    setFrom("");
    setTo("");
    setSpecificEquipment("");
    setMalfunctionType("");
    setPdtEdt("");
    setMonthKey("");
  }, []);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (shift) parts.push(`Shift: ${shift}`);
    if (equipmentType) parts.push(`Equipment type: ${equipmentType}`);
    if (recordMonth) parts.push(`Record month #: ${recordMonth}`);
    if (equipmentLocation) parts.push(`Location: ${equipmentLocation}`);
    if (failureModes) parts.push(`Failure mode: ${failureModes}`);
    if (failureCauses) parts.push(`Failure cause: ${failureCauses}`);
    if (technicianName) parts.push(`Technician: ${technicianName}`);
    if (specificEquipment) parts.push(`Equipment: ${specificEquipment}`);
    if (malfunctionType) parts.push(`Malfunction: ${malfunctionType}`);
    if (pdtEdt) parts.push(`PDT/EDT: ${pdtEdt}`);
    if (monthKey) parts.push(`Month: ${monthKey}`);
    if (from) parts.push(`From: ${from}`);
    if (to) parts.push(`To: ${to}`);
    return parts;
  }, [
    shift,
    equipmentType,
    recordMonth,
    equipmentLocation,
    failureModes,
    failureCauses,
    technicianName,
    specificEquipment,
    malfunctionType,
    pdtEdt,
    monthKey,
    from,
    to,
  ]);
  const hasActiveFilters = filterSummary.length > 0;

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-[var(--muted)]">
        Loading analytics…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">
        <p className="font-medium">Could not load analytics.</p>
        <p className="mt-2 text-sm text-red-200/80">{err}</p>
        <Link href="/analytics/tor" className="mt-4 inline-block text-sm text-[var(--accent)] underline">
          All analytics
        </Link>
      </div>
    );
  }

  const empty = data.kpis.eventCount === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          Scope: <span className="text-[var(--foreground)]">{scopeLabel}</span>
          {uploadScope !== "all" ? (
            <Link href="/analytics/tor" className="ml-3 text-[var(--accent)] hover:underline">
              Show all data
            </Link>
          ) : null}
        </p>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Cross-filter active</p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{filterSummary.join(" · ")}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Click the same chart segment again to deselect, or clear all below.</p>
          </div>
          <button
            type="button"
            onClick={clearAllFilters}
            className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
          >
            Clear selection
          </button>
        </div>
      ) : null}

      {empty ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
          <p className="text-lg font-medium text-[var(--foreground)]">No TOR rows in the database yet.</p>
          <p className="mt-2 text-sm">
            Use <strong className="text-[var(--foreground)]">Data → TOR grid → Mass import</strong> to load a workbook.
          </p>
        </div>
      ) : null}

      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.shifts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Equipment type
            </label>
            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.equipmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Equipment location
            </label>
            <select
              value={equipmentLocation}
              onChange={(e) => setEquipmentLocation(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.equipmentLocations.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Sheet month #
            </label>
            <select
              value={recordMonth}
              onChange={(e) => setRecordMonth(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Failure mode</label>
            <select
              value={failureModes}
              onChange={(e) => setFailureModes(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.failureModes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Failure cause</label>
            <select
              value={failureCauses}
              onChange={(e) => setFailureCauses(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.failureCauses.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Technician</label>
            <select
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.technicians.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Error date from</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setMonthKey("");
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Error date to</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setMonthKey("");
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            Reset filters
          </button>
        </div>
      </div>

      {!empty ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Events" value={formatInt(data.kpis.eventCount)} subtitle={`${scopeLabel.toLowerCase()} · after filters`} />
            <Kpi title="Total downtime" value={`${formatInt(data.kpis.totalDtMin)} min`} subtitle="sum of DT (min)" />
            <Kpi title="Avg MTTR" value={`${formatDec(data.kpis.avgMttrMin)} min`} subtitle="mean where present" />
            <Kpi title="Avg MTBF" value={`${formatDec(data.kpis.avgMtbfMin)} min`} subtitle="mean where present" />
          </div>

          <p className="text-xs text-[var(--muted)]">Tip: click any bar, line point, or pie slice to filter the other charts. Click again to clear that slice.</p>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Downtime by specific equipment (top)">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.bySpecificEquipment} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243041" />
                  <XAxis type="number" stroke="#8b98a8" tickFormatter={(v) => formatInt(Number(v))} />
                  <YAxis type="category" dataKey="name" width={140} stroke="#8b98a8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#141a22", border: "1px solid #243041" }}
                    formatter={(v: number) => [`${formatInt(v)} min`, "DT"]}
                  />
                  <Bar
                    dataKey="dtMin"
                    name="Downtime (min)"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(state) => {
                      const s = state as { payload?: { name?: string }; name?: string };
                      const name = s.payload?.name ?? s.name;
                      if (!name) return;
                      setSpecificEquipment((cur) => toggleString(cur, name));
                    }}
                  >
                    {data.bySpecificEquipment.map((row) => (
                      <Cell key={row.name} fill={row.name === specificEquipment ? SELECTED : "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Downtime by malfunction type">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.byMalfunction}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243041" />
                  <XAxis dataKey="name" stroke="#8b98a8" interval={0} angle={-18} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8b98a8" tickFormatter={(v) => formatInt(Number(v))} />
                  <Tooltip
                    contentStyle={{ background: "#141a22", border: "1px solid #243041" }}
                    formatter={(v: number) => [`${formatInt(v)} min`, "DT"]}
                  />
                  <Bar
                    dataKey="dtMin"
                    name="Downtime (min)"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(state) => {
                      const s = state as { payload?: { name?: string }; name?: string };
                      const name = s.payload?.name ?? s.name;
                      if (!name) return;
                      setMalfunctionType((cur) => toggleString(cur, name));
                    }}
                  >
                    {data.byMalfunction.map((row) => (
                      <Cell key={row.name} fill={row.name === malfunctionType ? SELECTED : "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Downtime trend by month">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243041" />
                  <XAxis dataKey="label" stroke="#8b98a8" />
                  <YAxis stroke="#8b98a8" tickFormatter={(v) => formatInt(Number(v))} />
                  <Tooltip
                    contentStyle={{ background: "#141a22", border: "1px solid #243041" }}
                    formatter={(v: number) => [`${formatInt(v)} min`, "DT"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="dtMin"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Downtime (min)"
                    dot={(dotProps) => {
                      const { cx, cy, payload } = dotProps as { cx: number; cy: number; payload: { key: string } };
                      const key = payload?.key;
                      const selectable = key && isYearMonthKey(key);
                      const sel = selectable && key === monthKey;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={sel ? 6 : 4}
                          fill={sel ? SELECTED : "#a855f7"}
                          stroke={selectable ? "#e9d5ff" : "#a855f7"}
                          strokeWidth={selectable ? 1 : 0}
                          className={selectable ? "cursor-pointer" : "cursor-default"}
                          onClick={
                            selectable
                              ? (e) => {
                                  e.stopPropagation();
                                  setMonthKey((cur) => {
                                    const next = toggleString(cur, key);
                                    if (next) {
                                      setFrom("");
                                      setTo("");
                                    }
                                    return next;
                                  });
                                }
                              : undefined
                          }
                        />
                      );
                    }}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="PDT vs EDT (minutes)">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    dataKey="dtMin"
                    data={data.pdtVsEdt}
                    nameKey="key"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    cursor="pointer"
                    onClick={(state) => {
                      const s = state as { payload?: { key?: string }; key?: string };
                      const key = s.payload?.key ?? s.key;
                      if (key === undefined || key === null) return;
                      setPdtEdt((cur) => toggleString(cur, String(key)));
                    }}
                  >
                    {data.pdtVsEdt.map((slice, i) => (
                      <Cell key={slice.key} fill={slice.key === pdtEdt ? SELECTED : COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#141a22", border: "1px solid #243041" }}
                    formatter={(v: number, _n, props) => {
                      const p = props.payload as { key?: string; count?: number };
                      return [`${formatInt(v)} min (${p.count ?? 0} events)`, p.key ?? ""];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Downtime by shift">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.byShift}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243041" />
                  <XAxis dataKey="shift" stroke="#8b98a8" />
                  <YAxis stroke="#8b98a8" tickFormatter={(v) => formatInt(Number(v))} />
                  <Tooltip
                    contentStyle={{ background: "#141a22", border: "1px solid #243041" }}
                    formatter={(v: number) => [`${formatInt(v)} min`, "DT"]}
                  />
                  <Bar
                    dataKey="dtMin"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(state) => {
                      const s = state as { payload?: { shift?: string }; shift?: string };
                      const sh = s.payload?.shift ?? s.shift;
                      if (!sh) return;
                      setShift((cur) => toggleString(cur, sh));
                    }}
                  >
                    {data.byShift.map((row) => (
                      <Cell key={row.shift} fill={row.shift === shift ? SELECTED : "#f97316"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Downtime by equipment type">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.byEquipmentType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243041" />
                  <XAxis dataKey="type" stroke="#8b98a8" interval={0} angle={-14} textAnchor="end" height={72} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8b98a8" tickFormatter={(v) => formatInt(Number(v))} />
                  <Tooltip
                    contentStyle={{ background: "#141a22", border: "1px solid #243041" }}
                    formatter={(v: number) => [`${formatInt(v)} min`, "DT"]}
                  />
                  <Bar
                    dataKey="dtMin"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(state) => {
                      const s = state as { payload?: { type?: string }; type?: string };
                      const t = s.payload?.type ?? s.type;
                      if (!t) return;
                      setEquipmentType((cur) => toggleString(cur, t));
                    }}
                  >
                    {data.byEquipmentType.map((row) => (
                      <Cell key={row.type} fill={row.type === equipmentType ? SELECTED : "#14b8a6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
