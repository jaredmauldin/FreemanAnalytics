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

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#eab308", "#ef4444", "#64748b"];

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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("uploadId", uploadScope);
    if (shift) p.set("shift", shift);
    if (equipmentType) p.set("equipmentType", equipmentType);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (refreshKey) p.set("_r", String(refreshKey));
    return p.toString();
  }, [uploadScope, shift, equipmentType, from, to, refreshKey]);

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

      {empty ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
          <p className="text-lg font-medium text-[var(--foreground)]">No TOR rows in the database yet.</p>
          <p className="mt-2 text-sm">
            Use <strong className="text-[var(--foreground)]">Data → TOR grid → Mass import</strong> to load a workbook.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Shift</label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="mt-1 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
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
            className="mt-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
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
          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setShift("");
            setEquipmentType("");
            setFrom("");
            setTo("");
          }}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
        >
          Reset filters
        </button>
      </div>

      {!empty ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Events" value={formatInt(data.kpis.eventCount)} subtitle={`${scopeLabel.toLowerCase()} · after filters`} />
            <Kpi title="Total downtime" value={`${formatInt(data.kpis.totalDtMin)} min`} subtitle="sum of DT (min)" />
            <Kpi title="Avg MTTR" value={`${formatDec(data.kpis.avgMttrMin)} min`} subtitle="mean where present" />
            <Kpi title="Avg MTBF" value={`${formatDec(data.kpis.avgMtbfMin)} min`} subtitle="mean where present" />
          </div>

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
                  <Bar dataKey="dtMin" name="Downtime (min)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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
                  <Bar dataKey="dtMin" name="Downtime (min)" fill="#22c55e" radius={[4, 4, 0, 0]} />
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
                  <Line type="monotone" dataKey="dtMin" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Downtime (min)" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="PDT vs EDT (minutes)">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie dataKey="dtMin" data={data.pdtVsEdt} nameKey="key" cx="50%" cy="50%" outerRadius={100}>
                    {data.pdtVsEdt.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                  <Bar dataKey="dtMin" fill="#f97316" radius={[4, 4, 0, 0]} />
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
                  <Bar dataKey="dtMin" fill="#14b8a6" radius={[4, 4, 0, 0]} />
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
