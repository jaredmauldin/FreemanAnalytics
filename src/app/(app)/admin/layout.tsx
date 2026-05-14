import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/auth/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!isAdminSession(user, user.id)) redirect("/analytics");
  return <div className="min-h-[50vh]">{children}</div>;
}
