"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { SupervisorOtAnalyticsPayload } from "@/lib/supervisorOt/analytics";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#eab308", "#ef4444", "#64748b"];

type Props = {
  uploadScope?: "all" | string;
  refreshKey?: number;
};

export function SupervisorOtDashboard({ uploadScope = "all", refreshKey = 0 }: Props) {
  const [employeeName, setEmployeeName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<SupervisorOtAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("uploadId", uploadScope);
    if (employeeName) p.set("employeeName", employeeName);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (refreshKey) p.set("_r", String(refreshKey));
    return p.toString();
  }, [uploadScope, employeeName, from, to, refreshKey]);

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
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-sm text-[var(--muted)]">
          Scope: <span className="text-[var(--foreground)]">{scopeLabel}</span>
          {uploadScope !== "all" ? (
            <Link href="/analytics/supervisor-ot" className="ml-3 text-[var(--accent)] hover:underline">
              Show all data
            </Link>
          ) : null}
        </p>
        <label className="text-xs text-[var(--muted)]">
          Employee
          <select
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            className="ml-2 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {data.filterOptions.employees.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--muted)]">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ml-2 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-[var(--muted)]">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ml-2 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
          />
        </label>
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
                    <Bar dataKey="hours" fill="#3b82f6" name="Hours" />
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
                    >
                      {data.byVolunteeredMandated.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                    <Bar dataKey="hours" fill="#22c55e" name="Hours" />
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
