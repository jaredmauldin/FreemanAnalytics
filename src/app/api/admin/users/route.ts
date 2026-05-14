import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAppAccessFromUser } from "@/lib/auth/access";
import { getRoleFromUser } from "@/lib/auth/roles";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";

export async function GET(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  try {
    const client = await clerkClient();
    const res = await client.users.getUserList({
      limit,
      offset,
      orderBy: "-created_at",
    });

    const users = res.data.map((u) => {
      const meta = (u.publicMetadata ?? {}) as Record<string, unknown>;
      return {
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress ?? null,
        firstName: u.firstName,
        lastName: u.lastName,
        createdAt: u.createdAt,
        lastSignInAt: u.lastSignInAt,
        appAccess: getAppAccessFromUser({ publicMetadata: meta }),
        role: getRoleFromUser({ publicMetadata: meta }),
      };
    });

    return NextResponse.json({
      users,
      totalCount: res.totalCount,
      limit,
      offset,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
