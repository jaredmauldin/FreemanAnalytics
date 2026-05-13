import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseTorSheet } from "@/lib/tor/parseTor";

export const maxDuration = 120;

const CHUNK = 200;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Form field "file" must be an .xlsm/.xlsx workbook.' }, { status: 400 });
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".xlsm") && !lower.endsWith(".xlsx")) {
    return NextResponse.json({ error: "Only .xlsm or .xlsx files are accepted." }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const rows = await parseTorSheet(buffer);
    if (!rows.length) {
      return NextResponse.json({ error: 'No data rows found on sheet "TOR".' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: upload, error: upErr } = await supabase
      .from("uploads")
      .insert({ filename: file.name, row_count: rows.length })
      .select("id")
      .single();

    if (upErr || !upload) {
      return NextResponse.json({ error: upErr?.message ?? "Failed to create upload record." }, { status: 500 });
    }

    const uploadId = upload.id as string;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK).map((r) => ({ ...r, upload_id: uploadId }));
      const { error: insErr } = await supabase.from("tor_events").insert(slice);
      if (insErr) {
        await supabase.from("tor_events").delete().eq("upload_id", uploadId);
        await supabase.from("uploads").delete().eq("id", uploadId);
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ uploadId, rowCount: rows.length, filename: file.name });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
