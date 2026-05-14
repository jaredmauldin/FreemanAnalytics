"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { ExteriorAnalyticsPayload } from "@/lib/exterior/analytics";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#eab308", "#ef4444", "#64748b"];

type Props = {
  uploadScope?: "all" | string;
  refreshKey?: number;
};

export function ExteriorDashboard({ uploadScope = "all", refreshKey = 0 }: Props) {
  const [department, setDepartment] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<ExteriorAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("uploadId", uploadScope);
    if (department) p.set("department", department);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (refreshKey) p.set("_r", String(refreshKey));
    return p.toString();
  }, [uploadScope, department, from, to, refreshKey]);

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
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-sm text-[var(--muted)]">
          Scope: <span className="text-[var(--foreground)]">{scopeLabel}</span>
          {uploadScope !== "all" ? (
            <Link href="/analytics/exterior" className="ml-3 text-[var(--accent)] hover:underline">
              Show all data
            </Link>
          ) : null}
        </p>
        <label className="text-xs text-[var(--muted)]">
          Department
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="ml-2 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {data.filterOptions.departments.map((d) => (
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
                    <Bar dataKey="count" fill="#3b82f6" name="Count" />
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
                    >
                      {data.byDepartment.map((_, i) => (
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
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Root cause (top)</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byRootCause}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#22c55e" name="Count" />
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
