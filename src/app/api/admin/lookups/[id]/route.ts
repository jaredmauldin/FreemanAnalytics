import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { isManagedLookupCategory } from "@/lib/lookups/adminCategories";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const patchSchema = z.object({
  label: z.string().min(1).max(2000),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: existing, error: exErr } = await supabase.from("lookup_values").select("id, category").eq("id", id).maybeSingle();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
  if (!existing?.category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isManagedLookupCategory(existing.category as string)) {
    return NextResponse.json({ error: "This lookup category cannot be edited here." }, { status: 403 });
  }

  const trimmed = parsed.data.label.trim();
  const { data, error } = await supabase
    .from("lookup_values")
    .update({ label: trimmed })
    .eq("id", id)
    .select("id, category, label")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ row: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  const { data: existing, error: exErr } = await supabase.from("lookup_values").select("id, category").eq("id", id).maybeSingle();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
  if (!existing?.category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isManagedLookupCategory(existing.category as string)) {
    return NextResponse.json({ error: "This lookup category cannot be deleted here." }, { status: 403 });
  }

  const { data, error } = await supabase.from("lookup_values").delete().eq("id", id).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
