import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapSupervisorOtInputToDbRow } from "@/lib/lookups/resolveSupervisorOt";
import { gridBodyToSupervisorOtInput, supervisorOtGridBodySchema } from "@/lib/supervisorOt/gridBody";
import { supervisorOtRowHash } from "@/lib/supervisorOt/rowHash";

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json();
    const parsed = supervisorOtGridBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const input = gridBodyToSupervisorOtInput(parsed.data);
    const hash = supervisorOtRowHash(input);
    const supabase = getSupabaseAdmin();
    const cache = new Map<string, string>();
    const row = await mapSupervisorOtInputToDbRow(supabase, input, parsed.data.upload_id ?? null, hash, cache);

    const { data, error } = await supabase.from("supervisor_ot_entries").insert(row).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data?.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
