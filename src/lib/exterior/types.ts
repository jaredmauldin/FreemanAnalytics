/** Parsed row → labels resolved to lookup_values on insert. */
export type ExteriorAlarmInput = {
  department: string | null;
  functional_location: string | null;
  machine: string | null;
  alarm_fault: string | null;
  symptoms: string | null;
  recovery_action: string | null;
  root_cause: string | null;
};
