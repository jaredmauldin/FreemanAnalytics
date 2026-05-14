"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DATASET } from "@/lib/datasets";
import { GridMassImport } from "@/components/GridMassImport";
import { LOOKUP_CATEGORY } from "@/lib/lookups/categories";

type LookupOption = { id: string; label: string };
type LookupsMap = Record<string, LookupOption[]>;

export type FlatTorRow = {
  id: string;
  upload_id: string | null;
  work_order_number: number | null;
  equipment_location: string | null;
  equipment_type: string | null;
  specific_equipment: string | null;
  malfunction_type: string | null;
  failure_modes: string | null;
  failure_causes: string | null;
  error_message: string | null;
  symptoms: string | null;
  corrective_measures: string | null;
  pdt_edt: string | null;
  dt_min: number | null;
  shift: string | null;
  month: number | null;
  date_of_error: string | null;
  technicians_name: string | null;
  week_number: number | null;
  num_pdt_calls: number | null;
  total_pdt_min: number | null;
  mttr_min: number | null;
  mtbf_min: number | null;
  row_hash: string | null;
  created_at: string;
};

type Draft = Partial<FlatTorRow> & { id?: string };

const emptyDraft = (): Draft => ({
  work_order_number: null,
  equipment_location: null,
  equipment_type: null,
  specific_equipment: null,
  malfunction_type: null,
  failure_modes: null,
  failure_causes: null,
  error_message: null,
  symptoms: null,
  corrective_measures: null,
  pdt_edt: null,
  dt_min: null,
  shift: null,
  month: null,
  date_of_error: null,
  technicians_name: null,
  week_number: null,
  num_pdt_calls: null,
  total_pdt_min: null,
  mttr_min: null,
  mtbf_min: null,
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

export function TorDataGrid() {
  const [lookups, setLookups] = useState<LookupsMap>({});
  const [rows, setRows] = useState<FlatTorRow[]>([]);
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
        sort: "date_of_error",
        dir: "desc",
      });
      const res = await fetch(`/api/tor-grid?${p}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Grid failed");
      setRows((j.rows ?? []) as FlatTorRow[]);
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

  function openEdit(r: FlatTorRow) {
    setDraft({
      id: r.id,
      upload_id: r.upload_id,
      work_order_number: r.work_order_number,
      equipment_location: r.equipment_location,
      equipment_type: r.equipment_type,
      specific_equipment: r.specific_equipment,
      malfunction_type: r.malfunction_type,
      failure_modes: r.failure_modes,
      failure_causes: r.failure_causes,
      error_message: r.error_message,
      symptoms: r.symptoms,
      corrective_measures: r.corrective_measures,
      pdt_edt: r.pdt_edt,
      dt_min: r.dt_min,
      shift: r.shift,
      month: r.month,
      date_of_error: r.date_of_error,
      technicians_name: r.technicians_name,
      week_number: r.week_number,
      num_pdt_calls: r.num_pdt_calls,
      total_pdt_min: r.total_pdt_min,
      mttr_min: r.mttr_min,
      mtbf_min: r.mtbf_min,
    });
    setModal("edit");
  }

  async function saveDraft() {
    setSaving(true);
    setErr(null);
    try {
      const body = {
        upload_id: draft.upload_id ?? null,
        work_order_number: draft.work_order_number,
        equipment_location: draft.equipment_location,
        equipment_type: draft.equipment_type,
        specific_equipment: draft.specific_equipment,
        malfunction_type: draft.malfunction_type,
        failure_modes: draft.failure_modes,
        failure_causes: draft.failure_causes,
        error_message: draft.error_message,
        symptoms: draft.symptoms,
        corrective_measures: draft.corrective_measures,
        pdt_edt: draft.pdt_edt,
        dt_min: draft.dt_min,
        shift: draft.shift,
        month: draft.month,
        date_of_error: draft.date_of_error,
        technicians_name: draft.technicians_name,
        week_number: draft.week_number,
        num_pdt_calls: draft.num_pdt_calls,
        total_pdt_min: draft.total_pdt_min,
        mttr_min: draft.mttr_min,
        mtbf_min: draft.mtbf_min,
      };
      const url = modal === "edit" && draft.id ? `/api/tor-events/${draft.id}` : "/api/tor-events";
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
    if (!confirm("Delete this TOR row permanently?")) return;
    setErr(null);
    const res = await fetch(`/api/tor-events/${id}`, { method: "DELETE" });
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
            placeholder="Equipment, error text, shift…"
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <GridMassImport
            dataset={DATASET.tor}
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
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">WO#</th>
              <th className="px-3 py-2">Equipment</th>
              <th className="px-3 py-2">Specific</th>
              <th className="px-3 py-2">DT min</th>
              <th className="px-3 py-2">Shift</th>
              <th className="px-3 py-2">Malfunction</th>
              <th className="px-3 py-2">Error</th>
              <th className="px-3 py-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-[var(--muted)]">
                  No rows match.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)]/80 hover:bg-[var(--background)]/50">
                  <td className="whitespace-nowrap px-3 py-2 text-[var(--foreground)]">{r.date_of_error ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{r.work_order_number ?? "—"}</td>
                  <td className="max-w-[140px] truncate px-3 py-2" title={r.equipment_type ?? ""}>
                    {r.equipment_type ?? "—"}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-2" title={r.specific_equipment ?? ""}>
                    {r.specific_equipment ?? "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{r.dt_min ?? "—"}</td>
                  <td className="px-3 py-2">{r.shift ?? "—"}</td>
                  <td className="max-w-[140px] truncate px-3 py-2" title={r.malfunction_type ?? ""}>
                    {r.malfunction_type ?? "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-[var(--muted)]" title={r.error_message ?? ""}>
                    {r.error_message ?? "—"}
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
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{modal === "add" ? "Add TOR row" : "Edit TOR row"}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Dropdown fields use normalized lists; new labels from Excel imports appear automatically. You can pick “—” for empty optional lookups.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[var(--muted)]">
                Work order #
                <input
                  type="number"
                  value={draft.work_order_number ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      work_order_number: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Date of error
                <input
                  type="date"
                  value={draft.date_of_error ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, date_of_error: e.target.value || null }))}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <SelectLookup
                label="Equipment location"
                category={LOOKUP_CATEGORY.equipment_location}
                value={draft.equipment_location}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, equipment_location: v }))}
              />
              <SelectLookup
                label="Equipment type"
                category={LOOKUP_CATEGORY.equipment_type}
                value={draft.equipment_type}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, equipment_type: v }))}
              />
              <SelectLookup
                label="Specific equipment"
                category={LOOKUP_CATEGORY.specific_equipment}
                value={draft.specific_equipment}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, specific_equipment: v }))}
              />
              <SelectLookup
                label="Malfunction type"
                category={LOOKUP_CATEGORY.malfunction_type}
                value={draft.malfunction_type}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, malfunction_type: v }))}
              />
              <SelectLookup
                label="Failure mode"
                category={LOOKUP_CATEGORY.failure_mode}
                value={draft.failure_modes}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, failure_modes: v }))}
              />
              <SelectLookup
                label="Failure cause"
                category={LOOKUP_CATEGORY.failure_cause}
                value={draft.failure_causes}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, failure_causes: v }))}
              />
              <SelectLookup
                label="PDT / EDT"
                category={LOOKUP_CATEGORY.pdt_edt}
                value={draft.pdt_edt}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, pdt_edt: v }))}
              />
              <SelectLookup
                label="Shift"
                category={LOOKUP_CATEGORY.shift}
                value={draft.shift}
                lookups={lookups}
                onChange={(v) => setDraft((d) => ({ ...d, shift: v }))}
              />
              <label className="block text-xs font-medium text-[var(--muted)]">
                Month #
                <input
                  type="number"
                  value={draft.month ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, month: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                DT (min)
                <input
                  type="number"
                  value={draft.dt_min ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, dt_min: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
              Error message
              <textarea
                value={draft.error_message ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, error_message: e.target.value || null }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
              Symptoms
              <textarea
                value={draft.symptoms ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, symptoms: e.target.value || null }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
              Corrective measures
              <textarea
                value={draft.corrective_measures ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, corrective_measures: e.target.value || null }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
              />
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[var(--muted)]">
                Technician
                <input
                  value={draft.technicians_name ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, technicians_name: e.target.value || null }))}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Week #
                <input
                  type="number"
                  value={draft.week_number ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, week_number: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                # PDT calls
                <input
                  type="number"
                  value={draft.num_pdt_calls ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, num_pdt_calls: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Total PDT (min)
                <input
                  type="number"
                  value={draft.total_pdt_min ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, total_pdt_min: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                MTTR (min)
                <input
                  type="number"
                  step="any"
                  value={draft.mttr_min ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, mttr_min: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                MTBF (min)
                <input
                  type="number"
                  step="any"
                  value={draft.mtbf_min ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, mtbf_min: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
              >
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
