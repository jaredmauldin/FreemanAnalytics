import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

function assertServiceRoleJwt(key: string) {
  const parts = key.split(".");
  if (parts.length < 2) return;
  const segment = parts[1];
  let json: string;
  try {
    json = Buffer.from(segment, "base64url").toString("utf8");
  } catch {
    try {
      const pad = segment.length % 4 === 0 ? "" : "=".repeat(4 - (segment.length % 4));
      json = Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
    } catch {
      return;
    }
  }
  try {
    const payload = JSON.parse(json) as { role?: string };
    if (payload.role && payload.role !== "service_role") {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY must be the secret key whose JWT payload has "role":"service_role". ' +
          'In Supabase: Project Settings → API → copy the service_role key (not the anon public key). ' +
          `This key has role "${payload.role}".`,
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("SUPABASE_SERVICE_ROLE_KEY")) throw e;
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  assertServiceRoleJwt(key);
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
