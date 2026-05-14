import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DATASET, parseDataset } from "@/lib/datasets";
import { parseTorSheet } from "@/lib/tor/parseTor";
import { dedupeTorRows, torRowHash } from "@/lib/tor/rowHash";
import { mapTorInputToDbRow } from "@/lib/lookups/resolve";
import { parseExteriorSheet } from "@/lib/exterior/parseExterior";
import { dedupeExteriorRows, exteriorRowHash } from "@/lib/exterior/rowHash";
import { mapExteriorInputToDbRow } from "@/lib/lookups/resolveExterior";
import { parseSupervisorOtSheet } from "@/lib/supervisorOt/parseSupervisorOt";
import { dedupeSupervisorOtRows, supervisorOtRowHash } from "@/lib/supervisorOt/rowHash";
import { mapSupervisorOtInputToDbRow } from "@/lib/lookups/resolveSupervisorOt";

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
  const dataset = parseDataset(form.get("dataset")) ?? DATASET.tor;

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".xlsm") && !lower.endsWith(".xlsx")) {
    return NextResponse.json({ error: "Only .xlsm or .xlsx files are accepted." }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const supabase = getSupabaseAdmin();
    const cache = new Map<string, string>();

    if (dataset === DATASET.tor) {
      const parsedRows = await parseTorSheet(buffer);
      if (!parsedRows.length) {
        return NextResponse.json({ error: 'No data rows found on sheet "TOR".' }, { status: 400 });
      }
      const rows = dedupeTorRows(parsedRows);
      const dedupedInFile = parsedRows.length - rows.length;

      if (mode === "replace") {
        const { error: rpcErr } = await supabase.rpc("clear_tor_import_data");
        if (rpcErr) {
          return NextResponse.json(
            {
              error: `${rpcErr.message} — Run migrations defining public.clear_tor_import_data.`,
            },
            { status: 500 },
          );
        }
      }

      const { data: upload, error: upErr } = await supabase
        .from("uploads")
        .insert({ filename: file.name, row_count: rows.length, dataset: DATASET.tor })
        .select("id")
        .single();
      if (upErr || !upload) {
        return NextResponse.json({ error: upErr?.message ?? "Failed to create upload record." }, { status: 500 });
      }
      const uploadId = upload.id as string;
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
          return NextResponse.json({ error: upsertErr.message }, { status: 500 });
        }
      }
      return NextResponse.json({
        dataset,
        uploadId,
        mode,
        rowCountParsed: parsedRows.length,
        rowCountUniqueInFile: rows.length,
        dedupedInFile,
        filename: file.name,
      });
    }

    if (dataset === DATASET.exterior_alarms) {
      const parsedRows = await parseExteriorSheet(buffer);
      if (!parsedRows.length) {
        return NextResponse.json({ error: 'No data rows found on sheet "Exterior".' }, { status: 400 });
      }
      const rows = dedupeExteriorRows(parsedRows);
      const dedupedInFile = parsedRows.length - rows.length;

      if (mode === "replace") {
        const { error: rpcErr } = await supabase.rpc("clear_exterior_alarm_import_data");
        if (rpcErr) {
          return NextResponse.json(
            { error: `${rpcErr.message} — Run migrations defining clear_exterior_alarm_import_data.` },
            { status: 500 },
          );
        }
      }

      const { data: upload, error: upErr } = await supabase
        .from("uploads")
        .insert({ filename: file.name, row_count: rows.length, dataset: DATASET.exterior_alarms })
        .select("id")
        .single();
      if (upErr || !upload) {
        return NextResponse.json({ error: upErr?.message ?? "Failed to create upload record." }, { status: 500 });
      }
      const uploadId = upload.id as string;
      const withRows = [];
      for (const r of rows) {
        const h = exteriorRowHash(r);
        withRows.push(await mapExteriorInputToDbRow(supabase, r, uploadId, h, cache));
      }
      for (let i = 0; i < withRows.length; i += CHUNK) {
        const slice = withRows.slice(i, i + CHUNK);
        const { error: upsertErr } = await supabase.from("exterior_alarm_events").upsert(slice, {
          onConflict: "row_hash",
          ignoreDuplicates: false,
        });
        if (upsertErr) {
          await supabase.from("exterior_alarm_events").delete().eq("upload_id", uploadId);
          await supabase.from("uploads").delete().eq("id", uploadId);
          return NextResponse.json({ error: upsertErr.message }, { status: 500 });
        }
      }
      return NextResponse.json({
        dataset,
        uploadId,
        mode,
        rowCountParsed: parsedRows.length,
        rowCountUniqueInFile: rows.length,
        dedupedInFile,
        filename: file.name,
      });
    }

    if (dataset === DATASET.supervisor_ot) {
      const parsedRows = await parseSupervisorOtSheet(buffer);
      if (!parsedRows.length) {
        return NextResponse.json({ error: 'No data rows found on sheet "Data".' }, { status: 400 });
      }
      const rows = dedupeSupervisorOtRows(parsedRows);
      const dedupedInFile = parsedRows.length - rows.length;

      if (mode === "replace") {
        const { error: rpcErr } = await supabase.rpc("clear_supervisor_ot_import_data");
        if (rpcErr) {
          return NextResponse.json(
            { error: `${rpcErr.message} — Run migrations defining clear_supervisor_ot_import_data.` },
            { status: 500 },
          );
        }
      }

      const { data: upload, error: upErr } = await supabase
        .from("uploads")
        .insert({ filename: file.name, row_count: rows.length, dataset: DATASET.supervisor_ot })
        .select("id")
        .single();
      if (upErr || !upload) {
        return NextResponse.json({ error: upErr?.message ?? "Failed to create upload record." }, { status: 500 });
      }
      const uploadId = upload.id as string;
      const withRows = [];
      for (const r of rows) {
        const h = supervisorOtRowHash(r);
        withRows.push(await mapSupervisorOtInputToDbRow(supabase, r, uploadId, h, cache));
      }
      for (let i = 0; i < withRows.length; i += CHUNK) {
        const slice = withRows.slice(i, i + CHUNK);
        const { error: upsertErr } = await supabase.from("supervisor_ot_entries").upsert(slice, {
          onConflict: "row_hash",
          ignoreDuplicates: false,
        });
        if (upsertErr) {
          await supabase.from("supervisor_ot_entries").delete().eq("upload_id", uploadId);
          await supabase.from("uploads").delete().eq("id", uploadId);
          return NextResponse.json({ error: upsertErr.message }, { status: 500 });
        }
      }
      return NextResponse.json({
        dataset,
        uploadId,
        mode,
        rowCountParsed: parsedRows.length,
        rowCountUniqueInFile: rows.length,
        dedupedInFile,
        filename: file.name,
      });
    }

    return NextResponse.json({ error: "Unsupported dataset." }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
