export type AppRole = "admin" | "user";

type MetadataUser = { publicMetadata?: Record<string, unknown> } | null | undefined;

/** Admins: Clerk Dashboard → Users → Public metadata: { "role": "admin" } */
export function getRoleFromUser(user: MetadataUser): AppRole {
  if (!user) return "user";
  return user.publicMetadata?.role === "admin" ? "admin" : "user";
}

export function isAdminUser(user: MetadataUser): boolean {
  return getRoleFromUser(user) === "admin";
}
