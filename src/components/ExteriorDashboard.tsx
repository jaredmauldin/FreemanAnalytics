"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { ExteriorAnalyticsPayload } from "@/lib/exterior/analytics";
import { toggleString } from "@/lib/chartCrossFilter";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#eab308", "#ef4444", "#64748b"];
const SELECTED = "#facc15";

type Props = {
  uploadScope?: "all" | string;
  refreshKey?: number;
};

export function ExteriorDashboard({ uploadScope = "all", refreshKey = 0 }: Props) {
  const [department, setDepartment] = useState("");
  const [functionalLocation, setFunctionalLocation] = useState("");
  const [machine, setMachine] = useState("");
  const [alarmFault, setAlarmFault] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<ExteriorAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("uploadId", uploadScope);
    if (department) p.set("department", department);
    if (functionalLocation) p.set("functionalLocation", functionalLocation);
    if (machine) p.set("machine", machine);
    if (alarmFault) p.set("alarmFault", alarmFault);
    if (rootCause) p.set("rootCause", rootCause);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (refreshKey) p.set("_r", String(refreshKey));
    return p.toString();
  }, [uploadScope, department, functionalLocation, machine, alarmFault, rootCause, from, to, refreshKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/analytics/exterior?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : res.statusText);
      setData(json as ExteriorAnalyticsPayload);
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
    setDepartment("");
    setFunctionalLocation("");
    setMachine("");
    setAlarmFault("");
    setRootCause("");
    setFrom("");
    setTo("");
  }, []);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (department) parts.push(`Department: ${department}`);
    if (functionalLocation) parts.push(`Functional location: ${functionalLocation}`);
    if (machine) parts.push(`Machine: ${machine}`);
    if (alarmFault) parts.push(`Alarm / fault: ${alarmFault}`);
    if (rootCause) parts.push(`Root cause: ${rootCause}`);
    if (from) parts.push(`From: ${from}`);
    if (to) parts.push(`To: ${to}`);
    return parts;
  }, [department, functionalLocation, machine, alarmFault, rootCause, from, to]);
  const hasActiveFilters = filterSummary.length > 0;

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-[var(--muted)]">
        Loading exterior alarms analytics…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200">
        <p className="font-medium">Could not load exterior analytics.</p>
        <p className="mt-2 text-sm text-red-200/80">{err}</p>
        <Link href="/analytics/exterior" className="mt-4 inline-block text-sm text-[var(--accent)] underline">
          All analytics
        </Link>
      </div>
    );
  }

  const empty = data.kpis.eventCount === 0;

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
            <Link href="/analytics/exterior" className="ml-3 text-[var(--accent)] hover:underline">
              Show all data
            </Link>
          ) : null}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Functional location</span>
            <select
              value={functionalLocation}
              onChange={(e) => setFunctionalLocation(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.functionalLocations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Machine</span>
            <select
              value={machine}
              onChange={(e) => setMachine(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {data.filterOptions.machines.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Created from</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            <span className="font-medium uppercase tracking-wide">Created to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
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
          <p className="text-lg font-medium text-[var(--foreground)]">No exterior alarm rows yet.</p>
          <p className="mt-2 text-sm">Use <strong className="text-[var(--foreground)]">Data → Exterior grid → Mass import</strong> to load a workbook.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs uppercase text-[var(--muted)]">Events</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data.kpis.eventCount}</p>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)]">Tip: click a bar or pie slice to filter the other charts. Click again to clear that slice.</p>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Top alarm / fault codes</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byAlarmFault} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Count"
                      cursor="pointer"
                      onClick={(state) => {
                        const s = state as { payload?: { name?: string }; name?: string };
                        const name = s.payload?.name ?? s.name;
                        if (!name) return;
                        setAlarmFault((cur) => toggleString(cur, name));
                      }}
                    >
                      {data.byAlarmFault.map((row) => (
                        <Cell key={row.name} fill={row.name === alarmFault ? SELECTED : "#3b82f6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">By department</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byDepartment}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      cursor="pointer"
                      onClick={(state) => {
                        const s = state as { payload?: { name?: string }; name?: string };
                        const name = s.payload?.name ?? s.name;
                        if (!name) return;
                        setDepartment((cur) => toggleString(cur, name));
                      }}
                    >
                      {data.byDepartment.map((slice, i) => (
                        <Cell key={slice.name} fill={slice.name === department ? SELECTED : COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Root cause (top)</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byRootCause}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Count"
                      cursor="pointer"
                      onClick={(state) => {
                        const s = state as { payload?: { name?: string }; name?: string };
                        const name = s.payload?.name ?? s.name;
                        if (!name) return;
                        setRootCause((cur) => toggleString(cur, name));
                      }}
                    >
                      {data.byRootCause.map((row) => (
                        <Cell key={row.name} fill={row.name === rootCause ? SELECTED : "#22c55e"} />
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
