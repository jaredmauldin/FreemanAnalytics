/** Must match DB migration categories. */
export const LOOKUP_CATEGORY = {
  equipment_location: "equipment_location",
  equipment_type: "equipment_type",
  specific_equipment: "specific_equipment",
  malfunction_type: "malfunction_type",
  failure_mode: "failure_mode",
  failure_cause: "failure_cause",
  pdt_edt: "pdt_edt",
  shift: "shift",
} as const;

export type LookupCategory = (typeof LOOKUP_CATEGORY)[keyof typeof LOOKUP_CATEGORY];
