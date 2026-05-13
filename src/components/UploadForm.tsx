"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMessage("Choose an .xlsm or .xlsx file first.");
      return;
    }
    setBusy(true);
    try {
      const up = new FormData();
      up.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: up });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Upload failed.");
      router.push(`/dashboard?upload=${json.uploadId as string}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="file" className="sr-only">
          Workbook file
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsm,.xlsx"
          className="block w-full cursor-pointer text-sm text-[var(--muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-600"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--background)] disabled:opacity-50"
      >
        {busy ? "Importing…" : "Import to Supabase"}
      </button>
      {message ? <p className="basis-full text-sm text-red-300">{message}</p> : null}
    </form>
  );
}
