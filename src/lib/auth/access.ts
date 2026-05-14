import { isAdminUser } from "@/lib/auth/roles";

export type AppAccessStatus = "approved" | "pending" | "revoked";

type MetadataUser = { publicMetadata?: Record<string, unknown> } | null | undefined;

/** Public metadata key used with Clerk webhooks + admin user management. */
export function getAppAccessFromUser(user: MetadataUser): AppAccessStatus {
  const raw = user?.publicMetadata?.appAccess;
  if (raw === "pending" || raw === "revoked") return raw;
  return "approved";
}

/** Admins always pass. When AUTO_APPROVE_SIGNUPS=false, only explicit `appAccess: "approved"` allows the app (webhook sets pending first). */
export function hasFullAppAccess(user: MetadataUser): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (process.env.AUTO_APPROVE_SIGNUPS === "false") {
    return user.publicMetadata?.appAccess === "approved";
  }
  return getAppAccessFromUser(user) === "approved";
}
