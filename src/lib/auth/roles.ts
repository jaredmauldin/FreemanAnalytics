export type AppRole = "admin" | "user";

type MetadataUser = { publicMetadata?: Record<string, unknown> } | null | undefined;

/** Admins: Clerk Dashboard → Users → Public metadata: { "role": "admin" } (case-insensitive). */
export function getRoleFromUser(user: MetadataUser): AppRole {
  if (!user) return "user";
  const raw = user.publicMetadata?.role;
  if (typeof raw === "string" && raw.trim().toLowerCase() === "admin") return "admin";
  return "user";
}

export function isAdminUser(user: MetadataUser): boolean {
  return getRoleFromUser(user) === "admin";
}

/** Optional bootstrap list when metadata is not set yet: comma-separated Clerk user IDs in CLERK_ADMIN_USER_IDS. */
export function isBootstrapAdminUserId(userId: string | undefined | null): boolean {
  if (!userId) return false;
  const raw = process.env.CLERK_ADMIN_USER_IDS;
  if (!raw?.trim()) return false;
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .includes(userId);
}

/** Prefer metadata role; fall back to env allowlist by Clerk user id. */
export function isAdminSession(user: MetadataUser, clerkUserId?: string | null): boolean {
  return isAdminUser(user) || isBootstrapAdminUserId(clerkUserId);
}
