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
    recordMonth: url.searchParams.get("recordMonth") || undefined,
    equipmentLocation: url.searchParams.get("equipmentLocation") || undefined,
    failureModes: url.searchParams.get("failureModes") || undefined,
    failureCauses: url.searchParams.get("failureCauses") || undefined,
    technicianName: url.searchParams.get("technicianName") || undefined,
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
  const {
    uploadId: scope,
    shift,
    equipmentType,
    recordMonth,
    equipmentLocation,
    failureModes,
    failureCauses,
    technicianName,
    from,
    to,
    specificEquipment,
    malfunctionType,
    pdtEdt,
    monthKey,
  } = parsed.data;

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
      "dt_min, shift, equipment_type, equipment_location, specific_equipment, malfunction_type, failure_modes, failure_causes, technicians_name, pdt_edt, month, date_of_error, mttr_min, mtbf_min";

    let q = supabase.from("v_tor_events_flat").select(selectCols);
    if (scope !== "all") {
      q = q.eq("upload_id", scope);
    }

    if (shift) q = q.eq("shift", shift);
    if (equipmentType) q = q.eq("equipment_type", equipmentType);
    if (equipmentLocation) q = q.eq("equipment_location", equipmentLocation);
    if (failureModes) q = q.eq("failure_modes", failureModes);
    if (failureCauses) q = q.eq("failure_causes", failureCauses);
    if (technicianName) q = q.eq("technicians_name", technicianName);
    if (recordMonth) {
      const n = Number(recordMonth);
      if (Number.isInteger(n) && n >= 1 && n <= 12) q = q.eq("month", n);
    }
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

    let metaQuery = supabase
      .from("v_tor_events_flat")
      .select("shift, equipment_type, equipment_location, failure_modes, failure_causes, technicians_name");
    if (scope !== "all") {
      metaQuery = metaQuery.eq("upload_id", scope);
    }

    const [filteredRes, metaRes] = await Promise.all([q, metaQuery]);
    if (filteredRes.error) return NextResponse.json({ error: filteredRes.error.message }, { status: 500 });
    if (metaRes.error) return NextResponse.json({ error: metaRes.error.message }, { status: 500 });

    const data = filteredRes.data;
    const metaRows = (metaRes.data ?? []) as Pick<
      TorEventRow,
      | "shift"
      | "equipment_type"
      | "equipment_location"
      | "failure_modes"
      | "failure_causes"
      | "technicians_name"
    >[];
    const shifts = [...new Set(metaRows.map((r) => r.shift).filter(Boolean))] as string[];
    const equipmentTypes = [...new Set(metaRows.map((r) => r.equipment_type).filter(Boolean))] as string[];
    const equipmentLocations = [...new Set(metaRows.map((r) => r.equipment_location).filter(Boolean))] as string[];
    const failureModesList = [...new Set(metaRows.map((r) => r.failure_modes).filter(Boolean))] as string[];
    const failureCausesList = [...new Set(metaRows.map((r) => r.failure_causes).filter(Boolean))] as string[];
    const technicians = [...new Set(metaRows.map((r) => r.technicians_name).filter(Boolean))] as string[];
    shifts.sort();
    equipmentTypes.sort();
    equipmentLocations.sort();
    failureModesList.sort();
    failureCausesList.sort();
    technicians.sort();

    const payload = buildAnalytics(scope, parsed.data, (data ?? []) as TorEventRow[], {
      shifts,
      equipmentTypes,
      equipmentLocations,
      failureModes: failureModesList,
      failureCauses: failureCausesList,
      technicians,
    });
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
