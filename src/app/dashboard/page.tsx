import Link from "next/link";
import { z } from "zod";
import { TorDashboard } from "@/components/TorDashboard";

type Search = { upload?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const raw = sp.upload;
  const uuidOk = raw ? z.string().uuid().safeParse(raw).success : false;
  const uploadScope = uuidOk && raw ? raw : "all";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
            ← Home (all data)
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {uploadScope === "all" ? "TOR analytics" : "TOR analytics — one import"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {uploadScope === "all" ? "Showing all rows in the database." : "Filtered to a single upload batch."}
          </p>
        </div>
      </div>

      <TorDashboard uploadScope={uploadScope} />
    </main>
  );
}
