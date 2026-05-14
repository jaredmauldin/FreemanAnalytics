import { TorDataGrid } from "@/components/TorDataGrid";

export default function DataPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">TOR data</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Search, edit, add, or delete downtime rows. Dropdown fields are stored in <code className="text-[var(--foreground)]">lookup_values</code> and shared with Excel imports.
      </p>
      <div className="mt-8">
        <TorDataGrid />
      </div>
    </main>
  );
}
