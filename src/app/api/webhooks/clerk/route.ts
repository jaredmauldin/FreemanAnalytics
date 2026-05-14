import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AppAccessStatus } from "@/lib/auth/access";

/**
 * Clerk → Webhooks → Add endpoint: https://YOUR_DOMAIN/api/webhooks/clerk
 * Subscribe to at least `user.created`. Signing secret → CLERK_WEBHOOK_SIGNING_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created") {
      const id = evt.data.id;
      const client = await clerkClient();
      const user = await client.users.getUser(id);
      const prev = (user.publicMetadata ?? {}) as Record<string, unknown>;
      const autoApprove = process.env.AUTO_APPROVE_SIGNUPS !== "false";
      const appAccess: AppAccessStatus = autoApprove ? "approved" : "pending";
      await client.users.updateUser(id, {
        publicMetadata: { ...prev, appAccess },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
