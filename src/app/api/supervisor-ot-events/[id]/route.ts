import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapSupervisorOtInputToDbRow } from "@/lib/lookups/resolveSupervisorOt";
import { gridBodyToSupervisorOtInput, supervisorOtGridBodySchema } from "@/lib/supervisorOt/gridBody";
import { supervisorOtRowHash } from "@/lib/supervisorOt/rowHash";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const json: unknown = await req.json();
    const parsed = supervisorOtGridBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();

    let uploadId: string | null;
    if (parsed.data.upload_id !== undefined) {
      uploadId = parsed.data.upload_id ?? null;
    } else {
      const { data: ex } = await supabase.from("supervisor_ot_entries").select("upload_id").eq("id", id).maybeSingle();
      uploadId = (ex?.upload_id as string | null) ?? null;
    }

    const input = gridBodyToSupervisorOtInput(parsed.data);
    const hash = supervisorOtRowHash(input);
    const cache = new Map<string, string>();
    const row = await mapSupervisorOtInputToDbRow(supabase, input, uploadId, hash, cache);

    const { data, error } = await supabase.from("supervisor_ot_entries").update(row).eq("id", id).select("id").maybeSingle();
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
    const { data, error } = await supabase.from("supervisor_ot_entries").delete().eq("id", id).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
