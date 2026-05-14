import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { AppAccessStatus } from "@/lib/auth/access";
import { getRoleFromUser } from "@/lib/auth/roles";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";

const patchSchema = z
  .object({
    appAccess: z.enum(["approved", "pending", "revoked"]).optional(),
    /** Clerk publicMetadata.role — "admin" or omit for standard user. */
    role: z.enum(["admin", "user"]).optional(),
  })
  .refine((d) => d.appAccess !== undefined || d.role !== undefined, {
    message: "Provide at least one of appAccess or role",
  });

export async function PATCH(req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { userId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const me = await currentUser();
  const { appAccess, role } = parsed.data;

  if (me?.id === userId && appAccess !== undefined && appAccess !== "approved") {
    return NextResponse.json({ error: "You cannot restrict your own account access." }, { status: 400 });
  }

  if (me?.id === userId && role === "user") {
    return NextResponse.json({ error: "You cannot remove your own admin role. Ask another admin to change it." }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const prev = (user.publicMetadata ?? {}) as Record<string, unknown>;

    if (role === "user" && getRoleFromUser({ publicMetadata: prev }) === "admin") {
      let otherAdmins = 0;
      let offset = 0;
      const limit = 100;
      while (true) {
        const list = await client.users.getUserList({ limit, offset, orderBy: "-created_at" });
        for (const u of list.data) {
          if (u.id === userId) continue;
          if (getRoleFromUser({ publicMetadata: u.publicMetadata as Record<string, unknown> }) === "admin") {
            otherAdmins++;
          }
        }
        if (otherAdmins > 0) break;
        if (list.data.length < limit) break;
        offset += limit;
        if (offset > 5000) break;
      }
      if (otherAdmins === 0) {
        return NextResponse.json({ error: "Cannot remove the last admin for this instance." }, { status: 400 });
      }
    }

    const next: Record<string, unknown> = { ...prev };
    if (appAccess !== undefined) {
      next.appAccess = appAccess as AppAccessStatus;
    }
    if (role === "admin") {
      next.role = "admin";
    } else if (role === "user") {
      delete next.role;
    }

    await client.users.updateUser(userId, { publicMetadata: next });
    return NextResponse.json({
      ok: true,
      userId,
      ...(appAccess !== undefined ? { appAccess } : {}),
      ...(role !== undefined ? { role } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
