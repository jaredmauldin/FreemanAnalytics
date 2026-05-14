import { Suspense } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminAccessNotice } from "@/components/AdminAccessNotice";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminSession } from "@/lib/auth/roles";

/** Never statically cache authenticated app HTML at build time. */
export const dynamic = "force-dynamic";

/**
 * Authenticated app shell. Middleware should already block anonymous users;
 * this server check ensures no app RSC/HTML runs without a Clerk session.
 */
export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const serverIsAdmin = isAdminSession(user, user?.id);

  return (
    <>
      <SiteHeader serverIsAdmin={serverIsAdmin} />
      <Suspense fallback={null}>
        <AdminAccessNotice />
      </Suspense>
      {children}
    </>
  );
}
