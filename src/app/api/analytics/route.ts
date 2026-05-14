import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { analyticsQuerySchema, buildAnalytics, type TorEventRow } from "@/lib/tor/analytics";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawUpload = url.searchParams.get("uploadId");
  const uploadId = !rawUpload || rawUpload === "all" ? "all" : rawUpload;

  const parsed = analyticsQuerySchema.safeParse({
    uploadId,
    shift: url.searchParams.get("shift") || undefined,
    equipmentType: url.searchParams.get("equipmentType") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    specificEquipment: url.searchParams.get("specificEquipment") || undefined,
    malfunctionType: url.searchParams.get("malfunctionType") || undefined,
    pdtEdt: url.searchParams.get("pdtEdt") || undefined,
    monthKey: url.searchParams.get("monthKey") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uploadId: scope, shift, equipmentType, from, to, specificEquipment, malfunctionType, pdtEdt, monthKey } =
    parsed.data;

  function torMonthBounds(key: string): { start: string; end: string } | null {
    const m = /^(\d{4})-(\d{2})$/.exec(key);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (mo < 1 || mo > 12) return null;
    const start = `${key}-01`;
    const last = new Date(Date.UTC(y, mo, 0));
    const end = `${y}-${String(mo).padStart(2, "0")}-${String(last.getUTCDate()).padStart(2, "0")}`;
    return { start, end };
  }

  try {
    const supabase = getSupabaseAdmin();
    const selectCols =
      "dt_min, shift, equipment_type, specific_equipment, malfunction_type, pdt_edt, month, date_of_error, mttr_min, mtbf_min";

    let q = supabase.from("v_tor_events_flat").select(selectCols);
    if (scope !== "all") {
      q = q.eq("upload_id", scope);
    }

    if (shift) q = q.eq("shift", shift);
    if (equipmentType) q = q.eq("equipment_type", equipmentType);
    if (specificEquipment) q = q.eq("specific_equipment", specificEquipment);
    if (malfunctionType) q = q.eq("malfunction_type", malfunctionType);
    if (pdtEdt) q = q.eq("pdt_edt", pdtEdt);
    if (monthKey) {
      const b = torMonthBounds(monthKey);
      if (b) {
        q = q.gte("date_of_error", b.start).lte("date_of_error", b.end);
      }
    }
    if (from) q = q.gte("date_of_error", from);
    if (to) q = q.lte("date_of_error", to);

    let metaQuery = supabase.from("v_tor_events_flat").select("shift, equipment_type");
    if (scope !== "all") {
      metaQuery = metaQuery.eq("upload_id", scope);
    }

    const [filteredRes, metaRes] = await Promise.all([q, metaQuery]);
    if (filteredRes.error) return NextResponse.json({ error: filteredRes.error.message }, { status: 500 });
    if (metaRes.error) return NextResponse.json({ error: metaRes.error.message }, { status: 500 });

    const data = filteredRes.data;
    const metaRows = (metaRes.data ?? []) as Pick<TorEventRow, "shift" | "equipment_type">[];
    const shifts = [...new Set(metaRows.map((r) => r.shift).filter(Boolean))] as string[];
    const equipmentTypes = [...new Set(metaRows.map((r) => r.equipment_type).filter(Boolean))] as string[];
    shifts.sort();
    equipmentTypes.sort();

    const payload = buildAnalytics(scope, parsed.data, (data ?? []) as TorEventRow[], {
      shifts,
      equipmentTypes,
    });
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
