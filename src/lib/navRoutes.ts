import { DATASET, type Dataset } from "@/lib/datasets";

type UploadRef = { id: string; dataset?: string };

export function analyticsPathForDataset(d: Dataset | string | undefined): string {
  if (d === DATASET.exterior_alarms) return "/analytics/exterior";
  if (d === DATASET.supervisor_ot) return "/analytics/supervisor-ot";
  return "/analytics/tor";
}

export function analyticsUploadHref(upload: UploadRef): string {
  const base = analyticsPathForDataset(upload.dataset);
  return `${base}?upload=${upload.id}`;
}
