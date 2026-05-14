import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildExteriorAnalytics, exteriorAnalyticsQuerySchema, type ExteriorFlatRow } from "@/lib/exterior/analytics";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawUpload = url.searchParams.get("uploadId");
  const uploadId = !rawUpload || rawUpload === "all" ? "all" : rawUpload;

  const parsed = exteriorAnalyticsQuerySchema.safeParse({
    uploadId,
    department: url.searchParams.get("department") || undefined,
    functionalLocation: url.searchParams.get("functionalLocation") || undefined,
    machine: url.searchParams.get("machine") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    alarmFault: url.searchParams.get("alarmFault") || undefined,
    rootCause: url.searchParams.get("rootCause") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uploadId: scope, department, functionalLocation, machine, from, to, alarmFault, rootCause } = parsed.data;

  try {
    const supabase = getSupabaseAdmin();
    const cols = "department, functional_location, machine, alarm_fault, root_cause, created_at";

    let q = supabase.from("v_exterior_alarms_flat").select(cols);
    if (scope !== "all") q = q.eq("upload_id", scope);
    if (department) q = q.eq("department", department);
    if (functionalLocation) q = q.eq("functional_location", functionalLocation);
    if (machine) q = q.eq("machine", machine);
    if (alarmFault) q = q.eq("alarm_fault", alarmFault);
    if (rootCause) q = q.eq("root_cause", rootCause);
    if (from) q = q.gte("created_at", `${from}T00:00:00.000Z`);
    if (to) q = q.lte("created_at", `${to}T23:59:59.999Z`);

    let metaQuery = supabase.from("v_exterior_alarms_flat").select("department, functional_location, machine");
    if (scope !== "all") metaQuery = metaQuery.eq("upload_id", scope);

    const [filteredRes, metaRes] = await Promise.all([q, metaQuery]);
    if (filteredRes.error) return NextResponse.json({ error: filteredRes.error.message }, { status: 500 });
    if (metaRes.error) return NextResponse.json({ error: metaRes.error.message }, { status: 500 });

    const data = filteredRes.data;
    const metaRows = (metaRes.data ?? []) as Pick<ExteriorFlatRow, "department" | "functional_location" | "machine">[];
    const departments = [...new Set(metaRows.map((r) => r.department).filter(Boolean))] as string[];
    const functionalLocations = [...new Set(metaRows.map((r) => r.functional_location).filter(Boolean))] as string[];
    const machines = [...new Set(metaRows.map((r) => r.machine).filter(Boolean))] as string[];
    departments.sort();
    functionalLocations.sort();
    machines.sort();

    const payload = buildExteriorAnalytics(scope, parsed.data, (data ?? []) as ExteriorFlatRow[], {
      departments,
      functionalLocations,
      machines,
    });
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
