import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/auth/roles";

/** For Route Handlers: 401/403 or null if admin. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(user, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
