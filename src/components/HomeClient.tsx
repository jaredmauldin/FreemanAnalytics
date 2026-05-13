"use client";

import { useState } from "react";
import Link from "next/link";
import { TorDashboard } from "@/components/TorDashboard";
import { UploadForm } from "@/components/UploadForm";

export type UploadRow = {
  id: string;
  filename: string;
  row_count: number;
  created_at: string;
};

type Props = {
  uploads: UploadRow[];
  listError: string | null;
};

export function HomeClient({ uploads, listError }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <section className="mb-10">
        <TorDashboard uploadScope="all" refreshKey={refreshKey} />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Import workbook</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Refresh data from <code className="rounded bg-[var(--background)] px-1.5 py-0.5 text-xs">TOR</code>. Macros are not executed. Duplicate TOR rows (same fingerprint) upsert—no double-counting.
        </p>
        <div className="mt-6">
          <UploadForm onImportComplete={() => setRefreshKey((k) => k + 1)} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent uploads</h2>
        {listError ? (
          <p className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/30 p-4 text-sm text-amber-100">
            <span className="font-medium">Supabase error.</span> Check <code className="rounded bg-[var(--background)] px-1">.env.local</code> and migrations. {listError}
          </p>
        ) : uploads.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No imports recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
            {uploads.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{u.filename}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {u.row_count} unique rows in file · {new Date(u.created_at).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard?upload=${u.id}`}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]"
                >
                  View this import only
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
