"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { AppNav } from "@/components/AppNav";
import { FreemanBrand } from "@/components/FreemanBrand";
import { isAdminSession } from "@/lib/auth/roles";

/**
 * Signed-in app chrome: Freeman Analytics brand + nav + account.
 * `serverIsAdmin` comes from Clerk on the server so the Admin menu shows even when the client
 * session has not hydrated `publicMetadata` yet.
 */
export function SiteHeader({ serverIsAdmin = false }: { serverIsAdmin?: boolean }) {
  const pathname = usePathname() ?? "";
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const clientAdmin = isAdminSession({ publicMetadata: user?.publicMetadata }, user?.id);
  const isAdmin = serverIsAdmin || clientAdmin;
  const hideMainNav = pathname.startsWith("/pending-approval");
  const showMainNav = !hideMainNav && (serverIsAdmin || (isLoaded && isSignedIn));

  return (
    <header className="relative z-[100] border-b border-[var(--border)] bg-[#0a0e16] shadow-[0_1px_0_rgba(59,130,246,0.08)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/35 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative z-[120] flex flex-wrap items-center gap-x-4 gap-y-2">
            <FreemanBrand href="/analytics" variant="header" />
            <span className="hidden h-6 w-px bg-[#243041] sm:block" aria-hidden />
            <p className="hidden text-xs text-zinc-500 sm:block sm:max-w-[200px] md:max-w-xs">
              TOR · Exterior alarms · Supervisor OT
            </p>
            {showMainNav ? <AppNav isAdmin={isAdmin} /> : null}
          </div>

          <nav className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto" aria-label="Account">
            {showMainNav ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 ring-2 ring-white/20",
                  },
                }}
              />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="inline-flex min-h-[40px] min-w-[96px] items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-md hover:bg-blue-50"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex min-h-[40px] min-w-[96px] items-center justify-center rounded-lg border-2 border-blue-400 bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-500"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
