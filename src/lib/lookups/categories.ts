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

/** Exterior Alarms & Faults — lookup_values.category */
export const EXTERIOR_LOOKUP_CATEGORY = {
  ext_department: "ext_department",
  ext_functional_location: "ext_functional_location",
  ext_machine: "ext_machine",
  ext_alarm_fault: "ext_alarm_fault",
  ext_root_cause: "ext_root_cause",
} as const;

/** Supervisor overtime — lookup_values.category */
export const SUPERVISOR_OT_LOOKUP_CATEGORY = {
  supervisor_ot_name: "supervisor_ot_name",
  supervisor_ot_mv: "supervisor_ot_mv",
} as const;
