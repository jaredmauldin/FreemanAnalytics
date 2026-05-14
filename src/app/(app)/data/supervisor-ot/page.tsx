import Link from "next/link";
import { SupervisorOtDataGrid } from "@/components/SupervisorOtDataGrid";

export default function SupervisorOtDataPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-[var(--muted)]">
        <Link href="/data" className="text-[var(--accent)] hover:underline">
          ← Data
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Supervisor overtime (A shift)</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Rows from the <code className="text-[var(--foreground)]">Data</code> sheet. Names and volunteered/mandated values are normalized lookups.
      </p>
      <div className="mt-8">
        <SupervisorOtDataGrid />
      </div>
    </main>
  );
}
