import Link from "next/link";
import { AdminUsersClient } from "@/components/AdminUsersClient";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-[var(--accent)] hover:underline">
          ← Admin home
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Users</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          View Clerk accounts, approve or hold new registrations, and revoke access. Changes apply immediately on the next request.
        </p>
      </div>

      <AdminUsersClient />
    </main>
  );
}
