import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DataHubClient, type UploadRow } from "@/components/DataHubClient";

export default async function DataHubPage() {
  let uploads: UploadRow[] = [];
  let listError: string | null = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("uploads")
      .select("id, filename, row_count, created_at, dataset")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) listError = error.message;
    else uploads = (data ?? []) as UploadRow[];
  } catch (e) {
    listError = e instanceof Error ? e.message : "Could not reach Supabase.";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">Data</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Transaction-level grids for each workbook type. Use <strong className="text-[var(--foreground)]">Mass import</strong> on a grid to load spreadsheets; use{" "}
          <strong className="text-[var(--foreground)]">Add row</strong> for single entries.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        <li>
          <Link
            href="/data/tor"
            className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--accent)]"
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)]">TOR downtime</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Injection molding TOR sheet — work orders, DT minutes, equipment.</p>
            <span className="mt-4 inline-block text-sm font-medium text-[var(--accent)]">Open grid →</span>
          </Link>
        </li>
        <li>
          <Link
            href="/data/exterior"
            className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--accent)]"
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Exterior alarms</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Alarms, faults, recovery actions, root cause.</p>
            <span className="mt-4 inline-block text-sm font-medium text-[var(--accent)]">Open grid →</span>
          </Link>
        </li>
        <li>
          <Link
            href="/data/supervisor-ot"
            className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--accent)]"
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Supervisor OT</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">A-shift overtime entries — hours and volunteered/mandated.</p>
            <span className="mt-4 inline-block text-sm font-medium text-[var(--accent)]">Open grid →</span>
          </Link>
        </li>
      </ul>

      <DataHubClient uploads={uploads} listError={listError} />
    </main>
  );
}
