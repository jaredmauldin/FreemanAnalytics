"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";

/**
 * Always use plain /sign-in and /sign-up links so login stays visible on deploy
 * even if Clerk modals or publishable key are misconfigured. Modal flows are optional.
 */
export function SiteHeader() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="relative z-[100] border-b border-[var(--border)] bg-[#0f1623] shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-white hover:text-blue-200">
          Freeman Analytics
        </Link>
        <span className="hidden text-[var(--muted)] sm:inline">·</span>
        <span className="hidden text-xs text-[var(--muted)] sm:inline">TOR</span>
        <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-200 sm:ml-1">
          Auth v2
        </span>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-2" aria-label="Account">
          {isLoaded && isSignedIn ? (
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
    </header>
  );
}
