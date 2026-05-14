"use client";

import Link from "next/link";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { AppNav } from "@/components/AppNav";

/**
 * Signed-in users see the app menu; signed-out users see Sign in / Sign up (self-service registration).
 */
export function SiteHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <header className="relative z-[100] border-b border-[var(--border)] bg-[#0f1623] shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-sm font-semibold tracking-tight text-white hover:text-blue-200">
              Freeman Analytics
            </Link>
            <span className="text-xs text-zinc-500">TOR</span>
            <AppNav isSignedIn={Boolean(isLoaded && isSignedIn)} isAdmin={Boolean(isAdmin)} />
          </div>

          <nav className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto" aria-label="Account">
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
      </div>
    </header>
  );
}
