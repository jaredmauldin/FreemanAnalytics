import Link from "next/link";
import { AnalyticsOverviewClient } from "@/components/AnalyticsOverviewClient";

export default function AnalyticsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Combined charts for TOR, exterior alarms, and supervisor overtime. Narrow to one import using the links below.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link href="/analytics/tor" className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]">
            TOR only
          </Link>
          <Link href="/analytics/exterior" className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]">
            Exterior only
          </Link>
          <Link href="/analytics/supervisor-ot" className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]">
            OT only
          </Link>
        </nav>
      </header>

      <AnalyticsOverviewClient />
    </main>
  );
}
