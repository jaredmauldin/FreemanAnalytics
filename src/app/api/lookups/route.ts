import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { LOOKUP_CATEGORY } from "@/lib/lookups/resolve";

export type LookupsResponse = Record<string, { id: string; label: string }[]>;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("lookup_values")
      .select("id, category, label")
      .order("category", { ascending: true })
      .order("label", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const out: LookupsResponse = {};
    for (const c of Object.values(LOOKUP_CATEGORY)) {
      out[c] = [];
    }
    for (const row of data ?? []) {
      const cat = row.category as string;
      if (!out[cat]) out[cat] = [];
      out[cat].push({ id: row.id as string, label: row.label as string });
    }
    return NextResponse.json({ lookups: out });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
