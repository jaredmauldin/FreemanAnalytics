"use client";

import { SignOutButton } from "@clerk/nextjs";

export function PendingSignOut() {
  return (
    <SignOutButton>
      <button
        type="button"
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:border-[var(--accent)]"
      >
        Sign out
      </button>
    </SignOutButton>
  );
}
