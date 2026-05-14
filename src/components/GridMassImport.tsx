"use client";

import { useState } from "react";
import type { Dataset } from "@/lib/datasets";
import { UploadForm } from "@/components/UploadForm";

type Props = {
  dataset: Dataset;
  onImportComplete?: () => void;
};

/** Collapsible spreadsheet import next to grid actions (append / replace). */
export function GridMassImport({ dataset, onImportComplete }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)]"
      >
        {open ? "Hide mass import" : "Mass import"}
      </button>
      {open ? (
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:max-w-lg">
          <p className="text-xs text-[var(--muted)]">
            Upload .xlsm / .xlsx. Append merges on row fingerprint; replace clears only this dataset&apos;s rows and uploads.
          </p>
          <div className="mt-3">
            <UploadForm
              dataset={dataset}
              onImportComplete={() => {
                onImportComplete?.();
                setOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
