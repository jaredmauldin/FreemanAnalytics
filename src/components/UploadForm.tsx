"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DATASET, type Dataset } from "@/lib/datasets";

type Props = {
  dataset: Dataset;
  onImportComplete?: () => void;
};

function copyForDataset(ds: Dataset): { hint: string; replaceConfirm: string; replaceBlurb: string } {
  if (ds === DATASET.tor) {
    return {
      hint: "Duplicate rows (same TOR fingerprint) merge on import; last row in file wins for duplicates.",
      replaceConfirm:
        "Replace wipes all TOR events and TOR upload history in the database, then imports this file. Continue?",
      replaceBlurb: "Deletes every TOR row and TOR-tagged uploads, then imports this workbook only.",
    };
  }
  if (ds === DATASET.exterior_alarms) {
    return {
      hint: 'Expects sheet "Exterior" with the standard headers. Row fingerprint dedupes across imports.',
      replaceConfirm:
        "Replace wipes all exterior alarm rows and exterior upload history, then imports this file. Continue?",
      replaceBlurb: "Deletes exterior alarm data and exterior-tagged uploads only (TOR and OT are untouched).",
    };
  }
  return {
    hint: 'Expects sheet "Data" with Name, Date, Hours, Volunteered/Mandated, TimeStamp.',
    replaceConfirm:
      "Replace wipes all supervisor OT rows and OT upload history, then imports this file. Continue?",
    replaceBlurb: "Deletes overtime entries and OT-tagged uploads only.",
  };
}

export function UploadForm({ dataset, onImportComplete }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const copy = copyForDataset(dataset);
  const inputId = `upload-file-${dataset}`;

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(null);
    const f = e.target.files?.[0];
    if (!f || f.size === 0) {
      setPendingFile(null);
      return;
    }
    const lower = f.name.toLowerCase();
    if (!lower.endsWith(".xlsm") && !lower.endsWith(".xlsx")) {
      setMessage("Use an .xlsm or .xlsx workbook.");
      e.target.value = "";
      setPendingFile(null);
      return;
    }
    setPendingFile(f);
  }

  function openImportChoice() {
    setMessage(null);
    if (!pendingFile) {
      setMessage("Choose a file first.");
      return;
    }
    setDialogOpen(true);
  }

  function closeDialog() {
    if (!busy) setDialogOpen(false);
  }

  async function runImport(mode: "append" | "replace") {
    if (!pendingFile) return;
    setBusy(true);
    setMessage(null);
    try {
      const up = new FormData();
      up.append("file", pendingFile);
      up.append("mode", mode);
      up.append("dataset", dataset);
      const res = await fetch("/api/upload", { method: "POST", body: up });
      const json = (await res.json()) as { error?: string; uploadId?: string };
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Upload failed.");
      setDialogOpen(false);
      setPendingFile(null);
      if (formRef.current) formRef.current.reset();
      onImportComplete?.();
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <form ref={formRef} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={(e) => e.preventDefault()}>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor={inputId} className="sr-only">
            Workbook file
          </label>
          <input
            id={inputId}
            name="file"
            type="file"
            accept=".xlsm,.xlsx"
            onChange={onPickFile}
            className="block w-full cursor-pointer text-sm text-[var(--muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-600"
          />
        </div>
        <button
          type="button"
          onClick={openImportChoice}
          disabled={busy || !pendingFile}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--background)] disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import workbook…"}
        </button>
        {message ? <p className="basis-full text-sm text-red-300">{message}</p> : null}
      </form>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div
            className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-dialog-title"
          >
            <h3 id="import-dialog-title" className="text-lg font-semibold text-[var(--foreground)]">
              How should this file be applied?
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--foreground)]">{pendingFile?.name}</span> — {copy.hint}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void runImport("append")}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left text-sm hover:border-[var(--accent)] disabled:opacity-50"
              >
                <span className="font-semibold text-[var(--foreground)]">Append</span>
                <span className="mt-1 block text-[var(--muted)]">Add or update rows. Existing data stays; matching rows are upserted (no duplicates).</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!confirm(copy.replaceConfirm)) return;
                  void runImport("replace");
                }}
                className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-left text-sm hover:border-red-500 disabled:opacity-50"
              >
                <span className="font-semibold text-red-200">Replace all</span>
                <span className="mt-1 block text-red-200/80">{copy.replaceBlurb}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={closeDialog}
                className="mt-1 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
