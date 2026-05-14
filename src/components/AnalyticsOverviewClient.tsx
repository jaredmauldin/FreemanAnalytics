"use client";

import Link from "next/link";
import { TorDashboard } from "@/components/TorDashboard";
import { ExteriorDashboard } from "@/components/ExteriorDashboard";
import { SupervisorOtDashboard } from "@/components/SupervisorOtDashboard";

/** Full analytics overview: all three datasets on one scrollable page. */
export function AnalyticsOverviewClient() {
  return (
    <div className="space-y-12">
      <p className="text-sm text-[var(--muted)]">
        Charts reflect the database after you import from a{" "}
        <Link className="text-[var(--accent)] hover:underline" href="/data">
          Data
        </Link>{" "}
        grid. For one import only, open the matching analytics sub-page from the Data hub or use the upload link there.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">TOR downtime</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Injection molding TOR workbook — sheet TOR.</p>
        <div className="mt-4">
          <TorDashboard uploadScope="all" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Exterior alarms & faults</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Sheet Exterior — alarm codes, recovery, root cause.</p>
        <div className="mt-4">
          <ExteriorDashboard uploadScope="all" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Supervisor overtime (A shift)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Overtime tracker — sheet Data.</p>
        <div className="mt-4">
          <SupervisorOtDashboard uploadScope="all" />
        </div>
      </section>
    </div>
  );
}
