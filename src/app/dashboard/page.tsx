import Link from "next/link";
import { TorDashboard } from "@/components/TorDashboard";

type Search = { upload?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const uploadId = sp.upload;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
            ← All uploads
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">TOR analytics</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Charts are computed from imported <code className="rounded bg-[var(--card)] px-1">tor_events</code> rows (Excel pivots/macros are not replayed
            in the browser).
          </p>
        </div>
      </div>

      {!uploadId ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted)]">
          Pick an upload from the home page, or append{" "}
          <code className="text-[var(--foreground)]">?upload=&lt;uuid&gt;</code> to the URL.
        </p>
      ) : (
        <TorDashboard uploadId={uploadId} />
      )}
    </main>
  );
}
