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
    enteredFrom: url.searchParams.get("enteredFrom") || undefined,
    enteredTo: url.searchParams.get("enteredTo") || undefined,
    minHours: url.searchParams.get("minHours") || undefined,
    maxHours: url.searchParams.get("maxHours") || undefined,
    volunteeredMandated: url.searchParams.get("volunteeredMandated") || undefined,
    monthKey: url.searchParams.get("monthKey") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const {
    uploadId: scope,
    employeeName,
    from,
    to,
    enteredFrom,
    enteredTo,
    minHours,
    maxHours,
    volunteeredMandated,
    monthKey,
  } = parsed.data;

  function otMonthBounds(key: string): { start: string; end: string } | null {
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
    const cols = "employee_name, work_date, hours, volunteered_mandated, entered_at";

    let q = supabase.from("v_supervisor_ot_flat").select(cols);
    if (scope !== "all") q = q.eq("upload_id", scope);
    if (employeeName) q = q.eq("employee_name", employeeName);
    if (volunteeredMandated) {
      if (volunteeredMandated === "—") q = q.is("volunteered_mandated", null);
      else q = q.eq("volunteered_mandated", volunteeredMandated);
    }
    if (monthKey) {
      const b = otMonthBounds(monthKey);
      if (b) {
        q = q.gte("work_date", b.start).lte("work_date", b.end);
      }
    }
    if (from) q = q.gte("work_date", from);
    if (to) q = q.lte("work_date", to);
    if (enteredFrom) q = q.gte("entered_at", `${enteredFrom}T00:00:00.000Z`);
    if (enteredTo) q = q.lte("entered_at", `${enteredTo}T23:59:59.999Z`);

    const minH = minHours ? Number(minHours) : NaN;
    if (Number.isFinite(minH)) q = q.gte("hours", minH);
    const maxH = maxHours ? Number(maxHours) : NaN;
    if (Number.isFinite(maxH)) q = q.lte("hours", maxH);

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
