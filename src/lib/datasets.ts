export const DATASET = {
  tor: "tor",
  exterior_alarms: "exterior_alarms",
  supervisor_ot: "supervisor_ot",
} as const;

export type Dataset = (typeof DATASET)[keyof typeof DATASET];

export function parseDataset(v: unknown): Dataset | null {
  if (v === DATASET.tor || v === DATASET.exterior_alarms || v === DATASET.supervisor_ot) return v;
  return null;
}
