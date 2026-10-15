import { z } from "zod";

export const updateMaintenanceSchema = z
    .object({
        enabled: z.boolean(),
        message: z.string().trim().min(1).max(1000).optional(),
        startsAt: z.string().datetime({ offset: true }).optional(),
        endsAt: z.string().datetime({ offset: true }).optional(),
    })
    .strict()
    .superRefine((value, context) => {
        if (
            value.startsAt &&
            value.endsAt &&
            new Date(value.startsAt) >= new Date(value.endsAt)
        ) {
            context.addIssue({
                code: "custom",
                path: ["endsAt"],
                message: "'endsAt' must be later than 'startsAt'.",
            });
        }
    });

export type UpdateMaintenanceInput = z.infer<
    typeof updateMaintenanceSchema
>;
