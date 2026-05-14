import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseTorSheet } from "@/lib/tor/parseTor";
import { dedupeTorRows, torRowHash } from "@/lib/tor/rowHash";
import { mapTorInputToDbRow } from "@/lib/lookups/resolve";

export const maxDuration = 120;

const CHUNK = 200;

const importModeSchema = (v: unknown): "append" | "replace" => (v === "replace" ? "replace" : "append");

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

  const mode = importModeSchema(form.get("mode"));
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".xlsm") && !lower.endsWith(".xlsx")) {
    return NextResponse.json({ error: "Only .xlsm or .xlsx files are accepted." }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const parsedRows = await parseTorSheet(buffer);
    if (!parsedRows.length) {
      return NextResponse.json({ error: 'No data rows found on sheet "TOR".' }, { status: 400 });
    }

    const rows = dedupeTorRows(parsedRows);
    const dedupedInFile = parsedRows.length - rows.length;

    const supabase = getSupabaseAdmin();

    if (mode === "replace") {
      const { error: rpcErr } = await supabase.rpc("clear_tor_import_data");
      if (rpcErr) {
        return NextResponse.json(
          {
            error:
              `${rpcErr.message} — Run the SQL migration that defines public.clear_tor_import_data (see supabase/migrations/20250512000003_tor_row_hash_upsert.sql).`,
          },
          { status: 500 },
        );
      }
    }

    const { data: upload, error: upErr } = await supabase
      .from("uploads")
      .insert({ filename: file.name, row_count: rows.length })
      .select("id")
      .single();

    if (upErr || !upload) {
      return NextResponse.json({ error: upErr?.message ?? "Failed to create upload record." }, { status: 500 });
    }

    const uploadId = upload.id as string;

    const cache = new Map<string, string>();
    const withRows = [];
    for (const r of rows) {
      const h = torRowHash(r);
      withRows.push(await mapTorInputToDbRow(supabase, r, uploadId, h, cache));
    }

    for (let i = 0; i < withRows.length; i += CHUNK) {
      const slice = withRows.slice(i, i + CHUNK);
      const { error: upsertErr } = await supabase.from("tor_events").upsert(slice, {
        onConflict: "row_hash",
        ignoreDuplicates: false,
      });
      if (upsertErr) {
        await supabase.from("tor_events").delete().eq("upload_id", uploadId);
        await supabase.from("uploads").delete().eq("id", uploadId);
        return NextResponse.json(
          {
            error: `${upsertErr.message} — Ensure migrations ran (lookup_values + v_tor_events_flat).`,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      uploadId,
      mode,
      rowCountParsed: parsedRows.length,
      rowCountUniqueInFile: rows.length,
      dedupedInFile,
      filename: file.name,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
