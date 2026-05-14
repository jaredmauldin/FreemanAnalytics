import { z } from "zod";
import type { TorEventInput } from "@/lib/tor/types";

/** Body for create/update from grid (string labels → resolved to lookup ids server-side). */
export const torGridBodySchema = z.object({
  upload_id: z.string().uuid().nullish(),
  work_order_number: z.coerce.number().nullable().optional(),
  equipment_location: z.string().nullable().optional(),
  equipment_type: z.string().nullable().optional(),
  specific_equipment: z.string().nullable().optional(),
  malfunction_type: z.string().nullable().optional(),
  failure_modes: z.string().nullable().optional(),
  failure_causes: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  corrective_measures: z.string().nullable().optional(),
  pdt_edt: z.string().nullable().optional(),
  dt_min: z.coerce.number().nullable().optional(),
  shift: z.string().nullable().optional(),
  month: z.coerce.number().nullable().optional(),
  date_of_error: z.string().nullable().optional(),
  technicians_name: z.string().nullable().optional(),
  week_number: z.coerce.number().nullable().optional(),
  num_pdt_calls: z.coerce.number().nullable().optional(),
  total_pdt_min: z.coerce.number().nullable().optional(),
  mttr_min: z.coerce.number().nullable().optional(),
  mtbf_min: z.coerce.number().nullable().optional(),
});

export type TorGridBody = z.infer<typeof torGridBodySchema>;

export function gridBodyToTorInput(body: TorGridBody): TorEventInput {
  return {
    work_order_number: body.work_order_number ?? null,
    equipment_location: body.equipment_location ?? null,
    equipment_type: body.equipment_type ?? null,
    specific_equipment: body.specific_equipment ?? null,
    malfunction_type: body.malfunction_type ?? null,
    failure_modes: body.failure_modes ?? null,
    failure_causes: body.failure_causes ?? null,
    error_message: body.error_message ?? null,
    symptoms: body.symptoms ?? null,
    corrective_measures: body.corrective_measures ?? null,
    pdt_edt: body.pdt_edt ?? null,
    dt_min: body.dt_min ?? null,
    shift: body.shift ?? null,
    month: body.month ?? null,
    date_of_error: body.date_of_error ?? null,
    technicians_name: body.technicians_name ?? null,
    week_number: body.week_number ?? null,
    num_pdt_calls: body.num_pdt_calls ?? null,
    total_pdt_min: body.total_pdt_min ?? null,
    mttr_min: body.mttr_min ?? null,
    mtbf_min: body.mtbf_min ?? null,
  };
}
