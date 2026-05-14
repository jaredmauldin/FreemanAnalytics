import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapTorInputToDbRow } from "@/lib/lookups/resolve";
import { gridBodyToTorInput, torGridBodySchema } from "@/lib/tor/gridBody";
import { torRowHash } from "@/lib/tor/rowHash";

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json();
    const parsed = torGridBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const input = gridBodyToTorInput(parsed.data);
    const hash = torRowHash(input);
    const supabase = getSupabaseAdmin();
    const cache = new Map<string, string>();
    const row = await mapTorInputToDbRow(supabase, input, parsed.data.upload_id ?? null, hash, cache);

    const { data, error } = await supabase.from("tor_events").insert(row).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data?.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
