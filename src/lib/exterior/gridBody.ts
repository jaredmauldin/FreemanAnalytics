import { z } from "zod";
import type { ExteriorAlarmInput } from "./types";

export const exteriorGridBodySchema = z.object({
  upload_id: z.string().uuid().nullish(),
  department: z.string().nullable().optional(),
  functional_location: z.string().nullable().optional(),
  machine: z.string().nullable().optional(),
  alarm_fault: z.string().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  recovery_action: z.string().nullable().optional(),
  root_cause: z.string().nullable().optional(),
});

export type ExteriorGridBody = z.infer<typeof exteriorGridBodySchema>;

export function gridBodyToExteriorInput(body: ExteriorGridBody): ExteriorAlarmInput {
  return {
    department: body.department ?? null,
    functional_location: body.functional_location ?? null,
    machine: body.machine ?? null,
    alarm_fault: body.alarm_fault ?? null,
    symptoms: body.symptoms ?? null,
    recovery_action: body.recovery_action ?? null,
    root_cause: body.root_cause ?? null,
  };
}
