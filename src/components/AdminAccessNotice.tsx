"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Shown when a non-admin hits /admin/* and is redirected to analytics with ?admin_denied=1 */
export function AdminAccessNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("admin_denied") !== "1") return;
    setOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("admin_denied");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!open) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b border-amber-800/50 bg-amber-950/40 px-4 py-3 text-center text-sm text-amber-100">
      <p>
        <strong className="font-semibold text-amber-50">Admin area unavailable.</strong> This account is not an admin
        in the Clerk app for this deployment (Vercel Production uses different keys and user ids than localhost
        Development). In Clerk → <strong className="text-amber-50">Production</strong> → your user → Public metadata,
        set <code className="rounded bg-black/30 px-1">role</code> to <code className="rounded bg-black/30 px-1">admin</code>
        , or set <code className="rounded bg-black/30 px-1">CLERK_ADMIN_USER_IDS</code> in Vercel to your{" "}
        <strong className="text-amber-50">Production</strong> user id.
      </p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="shrink-0 rounded-md border border-amber-700/80 px-3 py-1 text-xs font-medium text-amber-50 hover:bg-amber-900/50"
      >
        Dismiss
      </button>
    </div>
  );
}
