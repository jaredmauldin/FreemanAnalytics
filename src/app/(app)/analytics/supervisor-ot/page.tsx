import Link from "next/link";
import { z } from "zod";
import { SupervisorOtDashboard } from "@/components/SupervisorOtDashboard";

type Search = { upload?: string };

export default async function AnalyticsSupervisorOtPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const raw = sp.upload;
  const uuidOk = raw ? z.string().uuid().safeParse(raw).success : false;
  const uploadScope = uuidOk && raw ? raw : "all";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/analytics" className="text-sm text-[var(--accent)] hover:underline">
            ← All analytics
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {uploadScope === "all" ? "Supervisor OT — analytics" : "Supervisor OT — one import"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {uploadScope === "all" ? "All overtime entries." : "Filtered to a single upload batch."}
          </p>
        </div>
      </div>

      <SupervisorOtDashboard uploadScope={uploadScope} />
    </main>
  );
}
