import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapExteriorInputToDbRow } from "@/lib/lookups/resolveExterior";
import { exteriorGridBodySchema, gridBodyToExteriorInput } from "@/lib/exterior/gridBody";
import { exteriorRowHash } from "@/lib/exterior/rowHash";

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json();
    const parsed = exteriorGridBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const input = gridBodyToExteriorInput(parsed.data);
    const hash = exteriorRowHash(input);
    const supabase = getSupabaseAdmin();
    const cache = new Map<string, string>();
    const row = await mapExteriorInputToDbRow(supabase, input, parsed.data.upload_id ?? null, hash, cache);

    const { data, error } = await supabase.from("exterior_alarm_events").insert(row).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data?.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
