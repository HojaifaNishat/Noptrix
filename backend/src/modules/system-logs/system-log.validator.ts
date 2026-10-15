import { z } from "zod";

import {
    SYSTEM_LOG_LEVELS,
    SYSTEM_LOG_SOURCES,
} from "./system-log.model";

export const listSystemLogsSchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        level: z.enum(SYSTEM_LOG_LEVELS).optional(),
        source: z.enum(SYSTEM_LOG_SOURCES).optional(),
        requestId: z.string().trim().min(1).max(128).optional(),
        correlationId: z.string().trim().min(1).max(128).optional(),
        errorCode: z.string().trim().min(1).max(150).optional(),
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

export type ListSystemLogsQuery = z.infer<
    typeof listSystemLogsSchema
>;
