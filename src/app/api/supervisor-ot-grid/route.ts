import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_PAGE_SIZE = 100;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "25", 10) || 25));
  const search = (url.searchParams.get("search") ?? "").trim();
  const sort = url.searchParams.get("sort") ?? "work_date";
  const dir = url.searchParams.get("dir") === "asc" ? { ascending: true } : { ascending: false };

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const sortCol =
    (["work_date", "entered_at", "hours", "created_at", "employee_name"] as const).find((s) => s === sort) ??
    "work_date";

  try {
    const supabase = getSupabaseAdmin();
    let q = supabase.from("v_supervisor_ot_flat").select("*", { count: "exact" });

    if (search) {
      const safe = search.replace(/%/g, "").replace(/,/g, " ").slice(0, 120);
      const p = `%${safe}%`;
      q = q.or(`employee_name.ilike.${p},volunteered_mandated.ilike.${p}`);
    }

    q = q.order(sortCol, dir).range(from, to);

    const { data, error, count } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      rows: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
