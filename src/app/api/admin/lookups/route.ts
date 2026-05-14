import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { isManagedLookupCategory } from "@/lib/lookups/adminCategories";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const postSchema = z.object({
  category: z.string().min(1).max(120),
  label: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { category, label } = parsed.data;
  const trimmed = label.trim();
  if (!isManagedLookupCategory(category)) {
    return NextResponse.json({ error: "Category is not allowed for admin metadata." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("lookup_values")
    .insert({ category, label: trimmed })
    .select("id, category, label")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A value with this category and label already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ row: data });
}
