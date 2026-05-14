import { clerkClient } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { AppAccessStatus } from "@/lib/auth/access";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";

const patchSchema = z.object({
  appAccess: z.enum(["approved", "pending", "revoked"]),
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
  if (me?.id === userId && parsed.data.appAccess !== "approved") {
    return NextResponse.json({ error: "You cannot restrict your own account access." }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const prev = (user.publicMetadata ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = { ...prev, appAccess: parsed.data.appAccess as AppAccessStatus };
    await client.users.updateUser(userId, { publicMetadata: next });
    return NextResponse.json({
      ok: true,
      userId,
      appAccess: parsed.data.appAccess,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
