import { z } from "zod";

import { AUDIT_ACTIONS, AUDIT_ACTOR_TYPES } from "./audit-log.model";

const optionalDate = z.string().datetime({ offset: true }).optional();

export const listAuditLogsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),

    actorId: z.string().trim().min(1).max(128).optional(),

    actorType: z.enum(AUDIT_ACTOR_TYPES).optional(),

    action: z.enum(AUDIT_ACTIONS).optional(),

    resource: z.string().trim().min(1).max(150).optional(),

    resourceId: z.string().trim().min(1).max(128).optional(),

    success: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    from: optionalDate,
    to: optionalDate,

    requestId: z.string().trim().min(1).max(128).optional(),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "'to' must be greater than or equal to 'from'.",
      });
    }
  });

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsSchema>;

export const auditLogIdSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
  })
  .strict();
