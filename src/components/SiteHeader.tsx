"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

export function SiteHeader() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--foreground)] hover:text-white">
          Freeman Analytics
        </Link>
        <span className="text-[var(--muted)]">·</span>
        <span className="text-xs text-[var(--muted)]">TOR</span>
        <div className="ml-auto flex items-center gap-2">
          {!isLoaded ? (
            <span className="text-xs text-[var(--muted)]">…</span>
          ) : isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          ) : (
            <>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:border-[var(--accent)]"
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Sign up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
