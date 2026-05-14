"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { SupervisorOtAnalyticsPayload } from "@/lib/supervisorOt/analytics";
import { isYearMonthKey, toggleString } from "@/lib/chartCrossFilter";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#eab308", "#ef4444", "#64748b"];
const SELECTED = "#facc15";

type Props = {
  uploadScope?: "all" | string;
  refreshKey?: number;
};

export function SupervisorOtDashboard({ uploadScope = "all", refreshKey = 0 }: Props) {
  const [employeeName, setEmployeeName] = useState("");
  const [volunteeredMandated, setVolunteeredMandated] = useState("");
  const [monthKey, setMonthKey] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [enteredFrom, setEnteredFrom] = useState("");
  const [enteredTo, setEnteredTo] = useState("");
  const [minHours, setMinHours] = useState("");
  const [maxHours, setMaxHours] = useState("");
  const [data, setData] = useState<SupervisorOtAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("uploadId", uploadScope);
    if (employeeName) p.set("employeeName", employeeName);
    if (volunteeredMandated) p.set("volunteeredMandated", volunteeredMandated);
    if (monthKey) p.set("monthKey", monthKey);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (enteredFrom) p.set("enteredFrom", enteredFrom);
    if (enteredTo) p.set("enteredTo", enteredTo);
    if (minHours) p.set("minHours", minHours);
    if (maxHours) p.set("maxHours", maxHours);
    if (refreshKey) p.set("_r", String(refreshKey));
    return p.toString();
  }, [
    uploadScope,
    employeeName,
    volunteeredMandated,
    monthKey,
    from,
    to,
    enteredFrom,
    enteredTo,
    minHours,
    maxHours,
    refreshKey,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/analytics/supervisor-ot?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : res.statusText);
      setData(json as SupervisorOtAnalyticsPayload);
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
    setEmployeeName("");
    setVolunteeredMandated("");
    setMonthKey("");
    setFrom("");
    setTo("");
    setEnteredFrom("");
    setEnteredTo("");
    setMinHours("");
    setMaxHours("");
  }, []);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (employeeName) parts.push(`Employee: ${employeeName}`);
    if (volunteeredMandated) parts.push(`Type: ${volunteeredMandated}`);
    if (monthKey) parts.push(`Month: ${monthKey}`);
    if (from) parts.push(`Work date from: ${from}`);
    if (to) parts.push(`Work date to: ${to}`);
    if (enteredFrom) parts.push(`Entered from: ${enteredFrom}`);
    if (enteredTo) parts.push(`Entered to: ${enteredTo}`);
    if (minHours) parts.push(`Min hours: ${minHours}`);
    if (maxHours) parts.push(`Max hours: ${maxHours}`);
    return parts;
  }, [employeeName, volunteeredMandated, monthKey, from, to, enteredFrom, enteredTo, minHours, maxHours]);
  const hasActiveFilters = filterSummary.length > 0;

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-[var(--muted)]">
        Loading supervisor OT analytics…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">
        <p className="font-medium">Could not load overtime analytics.</p>
        <p className="mt-2 text-sm text-red-200/80">{err}</p>
        <Link href="/analytics/supervisor-ot" className="mt-4 inline-block text-sm text-[var(--accent)] underline">
          All analytics
        </Link>
      </div>
    );
  }

  const empty = data.kpis.entryCount === 0;

  return (
    <div className="space-y-8">
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

      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-sm text-[var(--muted)]">
          Scope: <span className="text-[var(--foreground)]">{scopeLabel}</span>
          {uploadScope !== "all" ? (
            <Link href="/analytics/supervisor-ot" className="ml-3 text-[var(--accent)] hover:underline">
              Show all data
            </Link>
          ) : null}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Employee</span>
            <select
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.employees.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Work date from</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setMonthKey("");
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Work date to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setMonthKey("");
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Entered at from</span>
            <input
              type="date"
              value={enteredFrom}
              onChange={(e) => setEnteredFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Entered at to</span>
            <input
              type="date"
              value={enteredTo}
              onChange={(e) => setEnteredTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Min hours</span>
            <input
              type="number"
              step="0.1"
              min={0}
              placeholder="Any"
              value={minHours}
              onChange={(e) => setMinHours(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm tabular-nums"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Max hours</span>
            <input
              type="number"
              step="0.1"
              min={0}
              placeholder="Any"
              value={maxHours}
              onChange={(e) => setMaxHours(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm tabular-nums"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            Reset filters
          </button>
        </div>
      </div>

      {empty ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
          <p className="text-lg font-medium text-[var(--foreground)]">No overtime rows yet.</p>
          <p className="mt-2 text-sm">Use <strong className="text-[var(--foreground)]">Data → OT grid → Mass import</strong> to load a workbook.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs uppercase text-[var(--muted)]">Entries</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data.kpis.entryCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs uppercase text-[var(--muted)]">Total hours</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data.kpis.totalHours.toFixed(1)}</p>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)]">Tip: click a bar or pie slice to filter the other charts. Click again to clear that slice.</p>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Hours by employee</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byEmployee} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip />
                    <Bar
                      dataKey="hours"
                      name="Hours"
                      cursor="pointer"
                      onClick={(state) => {
                        const s = state as { payload?: { name?: string }; name?: string };
                        const name = s.payload?.name ?? s.name;
                        if (!name) return;
                        setEmployeeName((cur) => toggleString(cur, name));
                      }}
                    >
                      {data.byEmployee.map((row) => (
                        <Cell key={row.name} fill={row.name === employeeName ? SELECTED : "#3b82f6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Volunteered vs mandated</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byVolunteeredMandated}
                      dataKey="hours"
                      nameKey="key"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={false}
                      cursor="pointer"
                      onClick={(state) => {
                        const s = state as { payload?: { key?: string }; key?: string };
                        const key = s.payload?.key ?? s.key;
                        if (key === undefined || key === null) return;
                        setVolunteeredMandated((cur) => toggleString(cur, String(key)));
                      }}
                    >
                      {data.byVolunteeredMandated.map((slice, i) => (
                        <Cell key={slice.key} fill={slice.key === volunteeredMandated ? SELECTED : COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Hours by month</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar
                      dataKey="hours"
                      name="Hours"
                      cursor="pointer"
                      onClick={(state) => {
                        const s = state as { payload?: { key?: string }; key?: string };
                        const key = s.payload?.key ?? s.key;
                        if (!key || !isYearMonthKey(key)) return;
                        setMonthKey((cur) => {
                          const next = toggleString(cur, key);
                          if (next) {
                            setFrom("");
                            setTo("");
                          }
                          return next;
                        });
                      }}
                    >
                      {data.byMonth.map((row) => (
                        <Cell key={row.key} fill={row.key === monthKey ? SELECTED : "#22c55e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
