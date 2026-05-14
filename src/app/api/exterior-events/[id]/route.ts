import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapExteriorInputToDbRow } from "@/lib/lookups/resolveExterior";
import { exteriorGridBodySchema, gridBodyToExteriorInput } from "@/lib/exterior/gridBody";
import { exteriorRowHash } from "@/lib/exterior/rowHash";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const json: unknown = await req.json();
    const parsed = exteriorGridBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();

    let uploadId: string | null;
    if (parsed.data.upload_id !== undefined) {
      uploadId = parsed.data.upload_id ?? null;
    } else {
      const { data: ex } = await supabase.from("exterior_alarm_events").select("upload_id").eq("id", id).maybeSingle();
      uploadId = (ex?.upload_id as string | null) ?? null;
    }

    const input = gridBodyToExteriorInput(parsed.data);
    const hash = exteriorRowHash(input);
    const cache = new Map<string, string>();
    const row = await mapExteriorInputToDbRow(supabase, input, uploadId, hash, cache);

    const { data, error } = await supabase.from("exterior_alarm_events").update(row).eq("id", id).select("id").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ id: data.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("exterior_alarm_events").delete().eq("id", id).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
