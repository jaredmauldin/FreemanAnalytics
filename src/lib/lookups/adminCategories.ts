import { EXTERIOR_LOOKUP_CATEGORY, LOOKUP_CATEGORY, SUPERVISOR_OT_LOOKUP_CATEGORY } from "@/lib/lookups/categories";

/** Human-readable groups for the admin metadata UI. */
export const LOOKUP_ADMIN_GROUPS = [
  {
    id: "tor",
    title: "TOR downtime",
    description: "Equipment, failure modes, shift, and related dropdowns on tor_events.",
    categories: Object.values(LOOKUP_CATEGORY),
  },
  {
    id: "exterior",
    title: "Exterior alarms & faults",
    description: "Department, location, machine, alarm text, and root cause on exterior_alarm_events.",
    categories: Object.values(EXTERIOR_LOOKUP_CATEGORY),
  },
  {
    id: "supervisor_ot",
    title: "Supervisor overtime",
    description: "Employee names and volunteered/mandated values on supervisor_ot_entries.",
    categories: Object.values(SUPERVISOR_OT_LOOKUP_CATEGORY),
  },
] as const;

const ALL = new Set<string>();
for (const g of LOOKUP_ADMIN_GROUPS) {
  for (const c of g.categories) ALL.add(c);
}

export function isManagedLookupCategory(category: string): boolean {
  return ALL.has(category);
}
