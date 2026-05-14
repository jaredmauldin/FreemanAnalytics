"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DATASET } from "@/lib/datasets";
import { GridMassImport } from "@/components/GridMassImport";
import { SUPERVISOR_OT_LOOKUP_CATEGORY } from "@/lib/lookups/categories";

type LookupOption = { id: string; label: string };
type LookupsMap = Record<string, LookupOption[]>;

export type FlatSupervisorOtRow = {
  id: string;
  upload_id: string | null;
  employee_name: string | null;
  work_date: string | null;
  hours: number | null;
  volunteered_mandated: string | null;
  entered_at: string | null;
  created_at: string;
};

type Draft = Partial<FlatSupervisorOtRow> & { id?: string };

const emptyDraft = (): Draft => ({
  employee_name: null,
  work_date: null,
  hours: null,
  volunteered_mandated: null,
  entered_at: null,
});

function SelectLookup({
  label,
  category,
  value,
  lookups,
  onChange,
}: {
  label: string;
  category: string;
  value: string | null | undefined;
  lookups: LookupsMap;
  onChange: (v: string | null) => void;
}) {
  const opts = lookups[category] ?? [];
  return (
    <label className="block text-xs font-medium text-[var(--muted)]">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)]"
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.id} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SupervisorOtDataGrid() {
  const [lookups, setLookups] = useState<LookupsMap>({});
  const [rows, setRows] = useState<FlatSupervisorOtRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadLookups = useCallback(async () => {
    const res = await fetch("/api/lookups", { cache: "no-store" });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Lookups failed");
    setLookups(j.lookups ?? {});
  }, []);

  const loadGrid = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const p = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: debouncedSearch,
        sort: "work_date",
        dir: "desc",
      });
      const res = await fetch(`/api/supervisor-ot-grid?${p}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Grid failed");
      setRows((j.rows ?? []) as FlatSupervisorOtRow[]);
      setTotal(typeof j.total === "number" ? j.total : 0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    void loadLookups().catch((e) => setErr(e instanceof Error ? e.message : "Lookups error"));
  }, [loadLookups]);

  useEffect(() => {
    void loadGrid();
  }, [loadGrid]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  function openAdd() {
    setDraft(emptyDraft());
    setModal("add");
  }

  function openEdit(r: FlatSupervisorOtRow) {
    setDraft({
      id: r.id,
      upload_id: r.upload_id,
      employee_name: r.employee_name,
      work_date: r.work_date,
      hours: r.hours,
      volunteered_mandated: r.volunteered_mandated,
      entered_at: r.entered_at,
    });
    setModal("edit");
  }

  async function saveDraft() {
    setSaving(true);
    setErr(null);
    try {
      const body = {
        upload_id: draft.upload_id ?? null,
        employee_name: draft.employee_name,
        work_date: draft.work_date,
        hours: draft.hours,
        volunteered_mandated: draft.volunteered_mandated,
        entered_at: draft.entered_at,
      };
      const url = modal === "edit" && draft.id ? `/api/supervisor-ot-events/${draft.id}` : "/api/supervisor-ot-events";
      const res = await fetch(url, {
        method: modal === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setModal(null);
      await loadGrid();
      await loadLookups();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this row permanently?")) return;
    setErr(null);
    const res = await fetch(`/api/supervisor-ot-events/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) {
      setErr(typeof j.error === "string" ? j.error : "Delete failed");
      return;
    }
    await loadGrid();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-medium text-[var(--muted)]">Search</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Name, volunteered/mandated…"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <GridMassImport
            dataset={DATASET.supervisor_ot}
            onImportComplete={() => {
              void loadGrid();
              void loadLookups();
            }}
          />
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Add row
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{err}</div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Work date</th>
              <th className="px-3 py-2">Hours</th>
              <th className="px-3 py-2">V / M</th>
              <th className="px-3 py-2">Entered</th>
              <th className="px-3 py-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[var(--muted)]">
                  No rows match.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)]/80 hover:bg-[var(--background)]/50">
                  <td className="px-3 py-2 font-medium">{r.employee_name ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2">{r.work_date ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{r.hours ?? "—"}</td>
                  <td className="px-3 py-2">{r.volunteered_mandated ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">
                    {r.entered_at ? new Date(r.entered_at).toLocaleString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <button type="button" className="text-[var(--accent)] hover:underline" onClick={() => openEdit(r)}>
                      Edit
                    </button>
                    <span className="text-[var(--muted)]"> · </span>
                    <button type="button" className="text-red-300 hover:underline" onClick={() => void deleteRow(r.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)]">
        <span>
          Page {page + 1} of {totalPages} · {total} rows
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setModal(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{modal === "add" ? "Add OT row" : "Edit OT row"}</h2>
            <div className="mt-4 grid gap-3">
              <SelectLookup
                label="Name"
                category={SUPERVISOR_OT_LOOKUP_CATEGORY.supervisor_ot_name}
                value={draft.employee_name}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, employee_name: v }))}
              />
              <label className="block text-xs font-medium text-[var(--muted)]">
                Work date
                <input
                  type="date"
                  value={draft.work_date ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, work_date: e.target.value || null }))}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Hours
                <input
                  type="number"
                  step="any"
                  value={draft.hours ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, hours: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <SelectLookup
                label="Volunteered / mandated"
                category={SUPERVISOR_OT_LOOKUP_CATEGORY.supervisor_ot_mv}
                value={draft.volunteered_mandated}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, volunteered_mandated: v }))}
              />
              <label className="block text-xs font-medium text-[var(--muted)]">
                Entry timestamp (ISO optional)
                <input
                  value={draft.entered_at ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, entered_at: e.target.value || null }))}
                  placeholder="2022-04-05T20:06:26.000Z"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => setModal(null)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveDraft()}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-center text-xs text-[var(--muted)]">
        <Link href="/analytics" className="text-[var(--accent)] hover:underline">
          ← Analytics
        </Link>
      </p>
    </div>
  );
}
