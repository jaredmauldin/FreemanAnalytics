import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { analyticsQuerySchema, buildAnalytics, type TorEventRow } from "@/lib/tor/analytics";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = analyticsQuerySchema.safeParse({
    uploadId: url.searchParams.get("uploadId") ?? "",
    shift: url.searchParams.get("shift") || undefined,
    equipmentType: url.searchParams.get("equipmentType") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uploadId, shift, equipmentType, from, to } = parsed.data;

  try {
    const supabase = getSupabaseAdmin();
    let q = supabase
      .from("tor_events")
      .select(
        "dt_min, shift, equipment_type, specific_equipment, malfunction_type, pdt_edt, month, date_of_error, mttr_min, mtbf_min",
      )
      .eq("upload_id", uploadId);

    if (shift) q = q.eq("shift", shift);
    if (equipmentType) q = q.eq("equipment_type", equipmentType);
    if (from) q = q.gte("date_of_error", from);
    if (to) q = q.lte("date_of_error", to);

    const metaQuery = supabase.from("tor_events").select("shift, equipment_type").eq("upload_id", uploadId);
    const [filteredRes, metaRes] = await Promise.all([q, metaQuery]);
    if (filteredRes.error) return NextResponse.json({ error: filteredRes.error.message }, { status: 500 });
    if (metaRes.error) return NextResponse.json({ error: metaRes.error.message }, { status: 500 });

    const data = filteredRes.data;
    const metaRows = (metaRes.data ?? []) as Pick<TorEventRow, "shift" | "equipment_type">[];
    const shifts = [...new Set(metaRows.map((r) => r.shift).filter(Boolean))] as string[];
    const equipmentTypes = [...new Set(metaRows.map((r) => r.equipment_type).filter(Boolean))] as string[];
    shifts.sort();
    equipmentTypes.sort();

    const payload = buildAnalytics(uploadId, parsed.data, (data ?? []) as TorEventRow[], {
      shifts,
      equipmentTypes,
    });
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
