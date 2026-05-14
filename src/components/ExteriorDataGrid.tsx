"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DATASET } from "@/lib/datasets";
import { GridMassImport } from "@/components/GridMassImport";
import { EXTERIOR_LOOKUP_CATEGORY } from "@/lib/lookups/categories";

type LookupOption = { id: string; label: string };
type LookupsMap = Record<string, LookupOption[]>;

export type FlatExteriorRow = {
  id: string;
  upload_id: string | null;
  department: string | null;
  functional_location: string | null;
  machine: string | null;
  alarm_fault: string | null;
  symptoms: string | null;
  recovery_action: string | null;
  root_cause: string | null;
  created_at: string;
};

type Draft = Partial<FlatExteriorRow> & { id?: string };

const emptyDraft = (): Draft => ({
  department: null,
  functional_location: null,
  machine: null,
  alarm_fault: null,
  symptoms: null,
  recovery_action: null,
  root_cause: null,
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

export function ExteriorDataGrid() {
  const [lookups, setLookups] = useState<LookupsMap>({});
  const [rows, setRows] = useState<FlatExteriorRow[]>([]);
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
        sort: "created_at",
        dir: "desc",
      });
      const res = await fetch(`/api/exterior-grid?${p}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Grid failed");
      setRows((j.rows ?? []) as FlatExteriorRow[]);
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

  function openEdit(r: FlatExteriorRow) {
    setDraft({
      id: r.id,
      upload_id: r.upload_id,
      department: r.department,
      functional_location: r.functional_location,
      machine: r.machine,
      alarm_fault: r.alarm_fault,
      symptoms: r.symptoms,
      recovery_action: r.recovery_action,
      root_cause: r.root_cause,
    });
    setModal("edit");
  }

  async function saveDraft() {
    setSaving(true);
    setErr(null);
    try {
      const body = {
        upload_id: draft.upload_id ?? null,
        department: draft.department,
        functional_location: draft.functional_location,
        machine: draft.machine,
        alarm_fault: draft.alarm_fault,
        symptoms: draft.symptoms,
        recovery_action: draft.recovery_action,
        root_cause: draft.root_cause,
      };
      const url = modal === "edit" && draft.id ? `/api/exterior-events/${draft.id}` : "/api/exterior-events";
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
    const res = await fetch(`/api/exterior-events/${id}`, { method: "DELETE" });
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
            placeholder="Department, alarm, machine, symptoms…"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <GridMassImport
            dataset={DATASET.exterior_alarms}
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
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Machine</th>
              <th className="px-3 py-2">Alarm / fault</th>
              <th className="px-3 py-2">Root cause</th>
              <th className="px-3 py-2">Created</th>
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
                  <td className="px-3 py-2">{r.department ?? "—"}</td>
                  <td className="max-w-[160px] truncate px-3 py-2" title={r.machine ?? ""}>
                    {r.machine ?? "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2" title={r.alarm_fault ?? ""}>
                    {r.alarm_fault ?? "—"}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2" title={r.root_cause ?? ""}>
                    {r.root_cause ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
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
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{modal === "add" ? "Add row" : "Edit row"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SelectLookup
                label="Department"
                category={EXTERIOR_LOOKUP_CATEGORY.ext_department}
                value={draft.department}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, department: v }))}
              />
              <SelectLookup
                label="Functional location"
                category={EXTERIOR_LOOKUP_CATEGORY.ext_functional_location}
                value={draft.functional_location}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, functional_location: v }))}
              />
              <SelectLookup
                label="Machine"
                category={EXTERIOR_LOOKUP_CATEGORY.ext_machine}
                value={draft.machine}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, machine: v }))}
              />
              <SelectLookup
                label="Alarm / fault"
                category={EXTERIOR_LOOKUP_CATEGORY.ext_alarm_fault}
                value={draft.alarm_fault}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, alarm_fault: v }))}
              />
              <SelectLookup
                label="Root cause"
                category={EXTERIOR_LOOKUP_CATEGORY.ext_root_cause}
                value={draft.root_cause}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, root_cause: v }))}
              />
            </div>
            <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
              Symptoms
              <textarea
                value={draft.symptoms ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, symptoms: e.target.value || null }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
              Recovery action
              <textarea
                value={draft.recovery_action ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, recovery_action: e.target.value || null }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              />
            </label>
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
