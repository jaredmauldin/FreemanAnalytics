import Link from "next/link";
import { ExteriorDataGrid } from "@/components/ExteriorDataGrid";

export default function ExteriorDataPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-[var(--muted)]">
        <Link href="/data" className="text-[var(--accent)] hover:underline">
          ← Data
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Exterior alarms & faults</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Search, edit, add, or delete rows from the Exterior sheet. Categorical fields use <code className="text-[var(--foreground)]">lookup_values</code>.
      </p>
      <div className="mt-8">
        <ExteriorDataGrid />
      </div>
    </main>
  );
}
