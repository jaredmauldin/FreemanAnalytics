import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";

/** Never statically cache authenticated app HTML at build time. */
export const dynamic = "force-dynamic";

/**
 * Authenticated app shell. Middleware should already block anonymous users;
 * this server check ensures no app RSC/HTML runs without a Clerk session.
 */
export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
