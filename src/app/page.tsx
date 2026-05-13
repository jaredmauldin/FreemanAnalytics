import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { HomeClient, type UploadRow } from "@/components/HomeClient";

export default async function HomePage() {
  let uploads: UploadRow[] = [];
  let listError: string | null = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("uploads")
      .select("id, filename, row_count, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) listError = error.message;
    else uploads = (data ?? []) as UploadRow[];
  } catch (e) {
    listError = e instanceof Error ? e.message : "Could not reach Supabase.";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">Freeman Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">TOR analytics</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          Downtime metrics across <strong className="text-[var(--foreground)]">all imported TOR data</strong>. Use{" "}
          <strong className="text-[var(--foreground)]">Import workbook</strong> below to append or replace; matching rows merge by upsert (no duplicates).
        </p>
      </header>

      <HomeClient uploads={uploads} listError={listError} />
    </main>
  );
}
