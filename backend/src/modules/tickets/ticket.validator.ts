import { z } from "zod";

import { TICKET_STATUSES, TICKET_PRIORITIES } from "./ticket.types";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(160),
    description: z.string().trim().min(5).max(10000),
    category: z.string().trim().min(2).max(80),
  })
  .strict();

export const ticketIdParamSchema = z.object({
  ticketId: z.string().regex(objectIdRegex, "Invalid ticket ID."),
});

export const ticketMessageSchema = z
  .object({
    message: z.string().trim().min(1).max(10000),
  })
  .strict();

export const updateTicketSchema = z
  .object({
    status: z
      .enum(
        Object.values(TICKET_STATUSES) as [
          (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES],
          ...(typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES][],
        ],
      )
      .optional(),

    priority: z
      .enum(
        Object.values(TICKET_PRIORITIES) as [
          (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES],
          ...(typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES][],
        ],
      )
      .optional(),
  })
  .strict()
  .refine(
    (value) => value.status !== undefined || value.priority !== undefined,
    { message: "Provide a status or priority to update." },
  );

const adminAssignmentSchema = z
  .object({
    adminId: z.string().regex(objectIdRegex, "Invalid admin ID."),
  })
  .strict()
  .transform((value) => ({
    assigneeType: "ADMIN" as const,
    adminId: value.adminId,
  }));

export const assignTicketSchema = z.union([
  adminAssignmentSchema,
  z
    .object({
      assigneeType: z.literal("ADMIN"),
      adminId: z.string().regex(objectIdRegex, "Invalid admin ID."),
    })
    .strict(),
  z
    .object({
      assigneeType: z.literal("OWNER"),
    })
    .strict(),
]);

export const ticketListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .enum(
        Object.values(TICKET_STATUSES) as [
          (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES],
          ...(typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES][],
        ],
      )
      .optional(),
    priority: z
      .enum(
        Object.values(TICKET_PRIORITIES) as [
          (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES],
          ...(typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES][],
        ],
      )
      .optional(),
  })
  .strict();
