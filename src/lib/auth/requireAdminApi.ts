import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/auth/roles";

const FORBIDDEN_HINT =
  "This session is not an admin in this Clerk application. On Vercel, use the same Clerk instance as your keys: open the Production user in Clerk → Metadata → Public and set role to admin, or set CLERK_ADMIN_USER_IDS to your Production user id (not the Development id from localhost).";

/** For Route Handlers: 401/403 or null if admin. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", hint: "No signed-in user; try signing in again." },
      { status: 401 },
    );
  }
  if (!isAdminSession(user, user.id)) {
    return NextResponse.json({ error: "Forbidden", hint: FORBIDDEN_HINT }, { status: 403 });
  }
  return null;
}
