import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { LookupMetadataAdmin } from "@/components/LookupMetadataAdmin";
import { getRoleFromUser } from "@/lib/auth/roles";

export default async function AdminPage() {
  const user = await currentUser();
  const role = getRoleFromUser(user);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">Admin</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Signed in as <span className="text-[var(--foreground)]">{user?.emailAddresses?.[0]?.emailAddress ?? user?.id}</span>{" "}
        · role: <span className="text-[var(--foreground)]">{role}</span>
      </p>

      <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Access & sign-up</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--foreground)]">Webhook</strong>: In Clerk → Webhooks, add{" "}
            <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">/api/webhooks/clerk</code> and subscribe to{" "}
            <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">user.created</code>. Paste the signing secret into{" "}
            <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">CLERK_WEBHOOK_SIGNING_SECRET</code> in your deployment env.
          </li>
          <li>
            By default <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">AUTO_APPROVE_SIGNUPS</code> is on: new users get{" "}
            <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">appAccess: approved</code> automatically. Set it to{" "}
            <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">false</code> to require approval on the{" "}
            <Link className="text-[var(--accent)] hover:underline" href="/admin/users">
              Users
            </Link>{" "}
            page.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Admins</strong> still use Clerk public metadata{" "}
            <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">{`{ "role": "admin" }`}</code> (Clerk Dashboard → user → Metadata → Public).
          </li>
        </ul>
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/users"
          className="inline-flex rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
        >
          Manage users →
        </Link>
      </section>

      <LookupMetadataAdmin />
    </main>
  );
}
