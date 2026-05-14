import { z } from "zod";
import type { SupervisorOtInput } from "./types";

export const supervisorOtGridBodySchema = z.object({
  upload_id: z.string().uuid().nullish(),
  employee_name: z.string().nullable().optional(),
  work_date: z.string().nullable().optional(),
  hours: z.coerce.number().nullable().optional(),
  volunteered_mandated: z.string().nullable().optional(),
  entered_at: z.string().nullable().optional(),
});

export type SupervisorOtGridBody = z.infer<typeof supervisorOtGridBodySchema>;

export function gridBodyToSupervisorOtInput(body: SupervisorOtGridBody): SupervisorOtInput {
  const ea = body.entered_at?.trim();
  return {
    employee_name: body.employee_name ?? null,
    work_date: body.work_date ?? null,
    hours: body.hours ?? null,
    volunteered_mandated: body.volunteered_mandated ?? null,
    entered_at: ea ? ea : null,
  };
}
