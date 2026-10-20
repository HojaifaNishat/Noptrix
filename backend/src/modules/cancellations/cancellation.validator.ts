import { z } from "zod";

import {
  CANCELLATION_REASONS,
  CANCELLATION_STATUSES,
} from "./cancellation.types";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

export const cancellationIdParamsSchema = z.object({
  cancellationId: objectIdSchema,
});

export const createCancellationSchema = z
  .object({
    orderId: objectIdSchema,

    reason: z.enum(CANCELLATION_REASONS),

    customerNote: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    itemIds: z
      .array(objectIdSchema)
      .min(1)
      .max(100)
      .optional(),
  })
  .strict();

export const reviewCancellationSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),

    approvedRefundAmount: z
      .number()
      .finite()
      .min(0)
      .optional(),

    reviewNote: z
      .string()
      .trim()
      .max(1000)
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.status === "APPROVED" &&
      value.approvedRefundAmount === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["approvedRefundAmount"],
        message: "Approved refund amount is required.",
      });
    }

    if (
      value.status === "REJECTED" &&
      value.approvedRefundAmount !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["approvedRefundAmount"],
        message: "Rejected cancellations cannot have an approved refund amount.",
      });
    }
  });

export const cancellationQuerySchema = z
  .object({
    status: z.enum(CANCELLATION_STATUSES).optional(),

    orderId: objectIdSchema.optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    sort: z.enum(["newest", "oldest"]).default("newest"),
  })
  .strict();

export type CreateCancellationBody = z.infer<
  typeof createCancellationSchema
>;

export type ReviewCancellationBody = z.infer<
  typeof reviewCancellationSchema
>;

export type CancellationQuery = z.infer<
  typeof cancellationQuerySchema
>;
