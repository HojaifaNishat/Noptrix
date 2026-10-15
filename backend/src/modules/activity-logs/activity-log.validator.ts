import { z } from "zod";

import {
    ACTIVITY_ACTOR_TYPES,
    ACTIVITY_TYPES,
} from "./activity-log.model";

export const listActivityLogsSchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        actorId: z.string().trim().min(1).max(128).optional(),
        actorType: z.enum(ACTIVITY_ACTOR_TYPES).optional(),
        activityType: z.enum(ACTIVITY_TYPES).optional(),
        action: z.string().trim().min(1).max(150).optional(),
        resource: z.string().trim().min(1).max(150).optional(),
        resourceId: z.string().trim().min(1).max(128).optional(),
        from: z.string().datetime({ offset: true }).optional(),
        to: z.string().datetime({ offset: true }).optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict()
    .superRefine((value, context) => {
        if (
            value.from &&
            value.to &&
            new Date(value.from) > new Date(value.to)
        ) {
            context.addIssue({
                code: "custom",
                path: ["to"],
                message: "'to' must be greater than or equal to 'from'.",
            });
        }
    });

export type ListActivityLogsQuery = z.infer<
    typeof listActivityLogsSchema
>;
