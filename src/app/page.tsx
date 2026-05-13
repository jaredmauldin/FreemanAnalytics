import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { UploadForm } from "@/components/UploadForm";

export default async function HomePage() {
  let uploads: { id: string; filename: string; row_count: number; created_at: string }[] = [];
  let listError: string | null = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("uploads")
      .select("id, filename, row_count, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) listError = error.message;
    else uploads = (data ?? []) as typeof uploads;
  } catch (e) {
    listError = e instanceof Error ? e.message : "Could not reach Supabase.";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">Freeman Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Injection molding TOR import</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Upload your plant workbook (for example <span className="text-[var(--foreground)]">TOR Plant 1 - Injection Molding.xlsm</span>
          ). Rows from the <strong className="text-[var(--foreground)]">TOR</strong> sheet are stored in Supabase; charts mirror the downtime views from
          the workbook (filters, equipment, shifts, PDT/EDT, and trends).
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Upload workbook</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Macros in the file are not executed—only cell values are read. The parser expects the standard TOR header row on sheet{" "}
          <code className="rounded bg-[var(--background)] px-1.5 py-0.5 text-xs">TOR</code>.
        </p>
        <div className="mt-6">
          <UploadForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent uploads</h2>
        {listError ? (
          <p className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/30 p-4 text-sm text-amber-100">
            <span className="font-medium">Supabase is not configured or returned an error.</span> Copy{" "}
            <code className="rounded bg-[var(--background)] px-1">.env.example</code> to{" "}
            <code className="rounded bg-[var(--background)] px-1">.env.local</code> and add your project URL and service role key, then run the SQL in{" "}
            <code className="rounded bg-[var(--background)] px-1">supabase/migrations</code>. Details: {listError}
          </p>
        ) : uploads.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No uploads yet. Import a workbook to see it here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
            {uploads.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{u.filename}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {u.row_count} rows · {new Date(u.created_at).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard?upload=${u.id}`}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Open analytics
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
