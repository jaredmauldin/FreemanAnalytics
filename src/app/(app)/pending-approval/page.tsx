import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingSignOut } from "@/components/PendingSignOut";
import { getAppAccessFromUser, hasFullAppAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (hasFullAppAccess(user)) redirect("/analytics");

  const access = getAppAccessFromUser(user);
  const strictNoAuto = process.env.AUTO_APPROVE_SIGNUPS === "false";
  const raw = user.publicMetadata?.appAccess;
  const displayPending =
    access === "pending" || (strictNoAuto && raw !== "approved" && raw !== "revoked");
  const email = user.emailAddresses[0]?.emailAddress ?? user.id;

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        {access === "revoked" ? "Access suspended" : "Account pending approval"}
      </h1>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Signed in as <span className="text-[var(--foreground)]">{email}</span>.
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {access === "revoked"
          ? "Your access to Freeman Analytics has been suspended. Contact an administrator if you believe this is a mistake."
          : displayPending
            ? strictNoAuto && raw === undefined
              ? "Your account is almost ready. If this message persists, ask an admin to confirm the Clerk webhook (user.created) is configured, or to approve you under Admin → View users."
              : "An administrator has not approved your account yet. You will be redirected automatically once access is granted."
            : ""}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <PendingSignOut />
        <Link href="/sign-in" className="text-sm text-[var(--accent)] hover:underline">
          Switch account
        </Link>
      </div>
    </main>
  );
}
