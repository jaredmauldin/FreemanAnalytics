"use client";

import Link from "next/link";
import { DATASET } from "@/lib/datasets";
import { analyticsUploadHref } from "@/lib/navRoutes";

export type UploadRow = {
  id: string;
  filename: string;
  row_count: number;
  created_at: string;
  dataset?: string;
};

type Props = {
  uploads: UploadRow[];
  listError: string | null;
};

function datasetLabel(u: UploadRow): string {
  const d = u.dataset ?? "tor";
  if (d === DATASET.exterior_alarms) return "Exterior";
  if (d === DATASET.supervisor_ot) return "Supervisor OT";
  return "TOR";
}

export function DataHubClient({ uploads, listError }: Props) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Recent uploads</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Open charts filtered to one import from Analytics, or continue editing rows in the matching data grid.</p>
      {listError ? (
        <p className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/30 p-4 text-sm text-amber-100">
          <span className="font-medium">Supabase error.</span> Check <code className="rounded bg-[var(--background)] px-1">.env.local</code> and migrations. {listError}
        </p>
      ) : uploads.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">No imports recorded yet. Use mass import on a data grid page.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
          {uploads.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{u.filename}</p>
                <p className="text-xs text-[var(--muted)]">
                  <span className="rounded bg-[var(--background)] px-1.5 py-0.5 text-[var(--foreground)]">{datasetLabel(u)}</span>
                  {" · "}
                  {u.row_count} unique rows in file · {new Date(u.created_at).toLocaleString()}
                </p>
              </div>
              <Link
                href={analyticsUploadHref(u)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                View in analytics
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
