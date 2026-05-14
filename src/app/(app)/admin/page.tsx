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
        <h2 className="text-base font-semibold text-[var(--foreground)]">How roles work</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--foreground)]">Standard users</strong> can self-register via{" "}
            <strong className="text-[var(--foreground)]">Sign up</strong> and use Data and Analytics.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Admins</strong> are assigned in the Clerk dashboard: open the user →{" "}
            <strong className="text-[var(--foreground)]">Metadata</strong> → <strong className="text-[var(--foreground)]">Public</strong> → set JSON{" "}
            <code className="rounded bg-[var(--background)] px-1 text-[var(--foreground)]">{`{ "role": "admin" }`}</code> → save. They then see Admin in the menu and can edit lookup metadata below.
          </li>
          <li>
            In Clerk, enable <strong className="text-[var(--foreground)]">Sign up</strong> under Authentication so anyone can create a standard account.
          </li>
        </ul>
      </section>

      <LookupMetadataAdmin />
    </main>
  );
}
