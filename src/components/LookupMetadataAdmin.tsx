"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LOOKUP_ADMIN_GROUPS } from "@/lib/lookups/adminCategories";

type Row = { id: string; category: string; label: string };

export function LookupMetadataAdmin() {
  const [groupId, setGroupId] = useState<(typeof LOOKUP_ADMIN_GROUPS)[number]["id"]>("tor");
  const [category, setCategory] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});

  const group = useMemo(() => LOOKUP_ADMIN_GROUPS.find((g) => g.id === groupId)!, [groupId]);

  useEffect(() => {
    setCategory(group.categories[0] ?? "");
  }, [group]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/lookups", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed to load lookups");
      const map = j.lookups as Record<string, { id: string; label: string }[]>;
      const list: Row[] = (map[category] ?? []).map((r) => ({
        id: r.id,
        category,
        label: r.label,
      }));
      list.sort((a, b) => a.label.localeCompare(b.label));
      setRows(list);
      setEditDraft({});
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addRow() {
    const label = newLabel.trim();
    if (!label || !category) return;
    setErr(null);
    const res = await fetch("/api/admin/lookups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, label }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(typeof j.error === "string" ? j.error : "Save failed");
      return;
    }
    setNewLabel("");
    await load();
  }

  async function saveRow(id: string) {
    const label = (editDraft[id] ?? "").trim();
    if (!label) return;
    setSavingId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/lookups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Update failed");
        return;
      }
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this metadata value? Transaction rows that reference it will clear that FK (set null).")) return;
    setErr(null);
    const res = await fetch(`/api/admin/lookups/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) {
      setErr(typeof j.error === "string" ? j.error : "Delete failed");
      return;
    }
    await load();
  }

  return (
    <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Lookup metadata</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Manage shared dropdown labels in <code className="text-[var(--foreground)]">lookup_values</code> for the three transaction domains. Add labels before they appear in imports, or rename entries (IDs stay stable for existing rows).
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="block text-xs font-medium text-[var(--muted)]">
          Dataset
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value as typeof groupId)}
            className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            {LOOKUP_ADMIN_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block max-w-xs rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            {group.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">{group.description}</p>

      <div className="mt-6 flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-6">
        <label className="min-w-[200px] flex-1 text-xs font-medium text-[var(--muted)]">
          New label in <span className="text-[var(--foreground)]">{category}</span>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Type a new list value…"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void addRow()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Add value
        </button>
      </div>

      {err ? <p className="mt-4 text-sm text-red-300">{err}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[var(--muted)]">
                  No values for this dataset yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)]/80">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--muted)]">{r.category}</td>
                  <td className="px-3 py-2">
                    <input
                      value={editDraft[r.id] ?? r.label}
                      onChange={(e) => setEditDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      className="w-full min-w-[200px] rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <button
                      type="button"
                      disabled={savingId === r.id}
                      onClick={() => void saveRow(r.id)}
                      className="text-[var(--accent)] hover:underline disabled:opacity-50"
                    >
                      Save
                    </button>
                    <span className="text-[var(--muted)]"> · </span>
                    <button type="button" onClick={() => void deleteRow(r.id)} className="text-red-300 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
