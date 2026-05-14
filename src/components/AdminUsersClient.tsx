"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
  lastSignInAt: number | null;
  appAccess: string;
  role: string;
};

export function AdminUsersClient() {
  const { user: me } = useUser();
  const [users, setUsers] = useState<Row[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users?limit=${limit}&offset=${offset}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : res.statusText);
      setUsers(json.users as Row[]);
      setTotalCount(typeof json.totalCount === "number" ? json.totalCount : 0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchUser = useCallback(
    async (userId: string, body: { appAccess?: "approved" | "pending" | "revoked"; role?: "admin" | "user" }) => {
      setBusyId(userId);
      setErr(null);
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : res.statusText);
        await load();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Update failed.");
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const setAccess = useCallback(
    async (userId: string, appAccess: "approved" | "pending" | "revoked") => {
      await patchUser(userId, { appAccess });
    },
    [patchUser],
  );

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Directory</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Set <strong className="text-[var(--foreground)]">Clerk role</strong> (public metadata{" "}
            <code className="rounded bg-[var(--background)] px-1">role</code>) for Admin vs User. App access (
            <code className="rounded bg-[var(--background)] px-1">appAccess</code>) controls who can open Data / Analytics.
          </p>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {totalCount === 0 ? "No users" : `Showing ${offset + 1}–${Math.min(offset + users.length, totalCount)} of ${totalCount}`}
        </p>
      </div>

      {err ? (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{err}</div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Clerk role</th>
              <th className="px-4 py-3 font-medium">Access</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">
                  No users in this page.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                const joined = new Date(u.createdAt).toLocaleString();
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--border)] text-xs font-semibold text-[var(--foreground)]">
                          {(u.email?.[0] ?? u.id[0] ?? "?").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{name}</p>
                          <p className="text-xs text-[var(--muted)]">{u.email ?? u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`role-${u.id}`}>
                        Clerk role for {u.email ?? u.id}
                      </label>
                      <select
                        id={`role-${u.id}`}
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => {
                          const v = e.target.value as "admin" | "user";
                          if (v === u.role) return;
                          void patchUser(u.id, { role: v });
                        }}
                        className="max-w-[160px] rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] disabled:opacity-50"
                      >
                        <option value="user" disabled={Boolean(me?.id === u.id && u.role === "admin")}>
                          User
                        </option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.appAccess === "approved"
                            ? "text-emerald-400"
                            : u.appAccess === "pending"
                              ? "text-amber-400"
                              : "text-red-400"
                        }
                      >
                        {u.appAccess}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)] tabular-nums">{joined}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          disabled={busy || u.appAccess === "approved"}
                          onClick={() => void setAccess(u.id, "approved")}
                          className="rounded-md border border-emerald-800/60 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy || u.appAccess === "pending"}
                          onClick={() => void setAccess(u.id, "pending")}
                          className="rounded-md border border-amber-800/60 px-2 py-1 text-xs text-amber-200 hover:bg-amber-950/30 disabled:opacity-40"
                        >
                          Hold
                        </button>
                        <button
                          type="button"
                          disabled={busy || u.appAccess === "revoked"}
                          onClick={() => void setAccess(u.id, "revoked")}
                          className="rounded-md border border-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-40"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <button
          type="button"
          disabled={offset === 0 || loading}
          onClick={() => setOffset((o) => Math.max(0, o - limit))}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={loading || offset + users.length >= totalCount}
          onClick={() => setOffset((o) => o + limit)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
