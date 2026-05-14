import { FreemanBrand } from "@/components/FreemanBrand";

/**
 * Sign-in / sign-up: marketing column + auth forms. No app nav.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06080c] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <aside className="relative flex flex-col justify-center border-b border-[#1e2939] px-6 py-10 lg:w-[46%] lg:min-h-screen lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(59,130,246,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent lg:bg-gradient-to-br" />
          <div className="relative max-w-md">
            <FreemanBrand variant="hero" />
            <h1 className="mt-8 text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
              Manufacturing intelligence for your plant
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Unify TOR downtime, exterior alarms, and supervisor overtime in one secure workspace—import workbooks, explore
              dashboards, and keep master data aligned with how your team already works.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2">
                <span className="mt-0.5 text-blue-400" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-zinc-200">TOR analytics</strong> — downtime trends, equipment, and shift views from
                  standard TOR sheets.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-blue-400" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-zinc-200">Exterior alarms & faults</strong> — searchable history of faults, recovery
                  actions, and root causes.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-blue-400" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-zinc-200">Supervisor overtime</strong> — hours and volunteered vs mandated reporting for
                  A-shift trackers.
                </span>
              </li>
            </ul>
            <p className="mt-10 text-xs text-zinc-500">Trusted operations data. Sign in with your company account to continue.</p>
          </div>
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 lg:px-8 lg:py-16">{children}</main>
      </div>
    </div>
  );
}
