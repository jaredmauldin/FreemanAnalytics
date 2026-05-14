import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildSupervisorOtAnalytics,
  supervisorOtAnalyticsQuerySchema,
  type SupervisorOtFlatRow,
} from "@/lib/supervisorOt/analytics";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawUpload = url.searchParams.get("uploadId");
  const uploadId = !rawUpload || rawUpload === "all" ? "all" : rawUpload;

  const parsed = supervisorOtAnalyticsQuerySchema.safeParse({
    uploadId,
    employeeName: url.searchParams.get("employeeName") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { uploadId: scope, employeeName, from, to } = parsed.data;

  try {
    const supabase = getSupabaseAdmin();
    const cols = "employee_name, work_date, hours, volunteered_mandated, entered_at";

    let q = supabase.from("v_supervisor_ot_flat").select(cols);
    if (scope !== "all") q = q.eq("upload_id", scope);
    if (employeeName) q = q.eq("employee_name", employeeName);
    if (from) q = q.gte("work_date", from);
    if (to) q = q.lte("work_date", to);

    let metaQuery = supabase.from("v_supervisor_ot_flat").select("employee_name");
    if (scope !== "all") metaQuery = metaQuery.eq("upload_id", scope);

    const [filteredRes, metaRes] = await Promise.all([q, metaQuery]);
    if (filteredRes.error) return NextResponse.json({ error: filteredRes.error.message }, { status: 500 });
    if (metaRes.error) return NextResponse.json({ error: metaRes.error.message }, { status: 500 });

    const data = filteredRes.data;
    const metaRows = (metaRes.data ?? []) as Pick<SupervisorOtFlatRow, "employee_name">[];
    const employees = [...new Set(metaRows.map((r) => r.employee_name).filter(Boolean))] as string[];
    employees.sort();

    const payload = buildSupervisorOtAnalytics(scope, parsed.data, (data ?? []) as SupervisorOtFlatRow[], {
      employees,
    });
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
