import { z } from "zod";

import {
  REFUND_REASONS,
  REFUND_STATUSES,
} from "./refund.types";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

const noteSchema = z
  .string()
  .trim()
  .max(1000)
  .optional();

export const refundIdParamsSchema = z.object({
  refundId: objectIdSchema,
});

export const createRefundSchema = z
  .object({
    orderId: objectIdSchema,

    paymentId: objectIdSchema.optional(),

    cancellationId: objectIdSchema.optional(),

    returnId: objectIdSchema.optional(),

    amount: z
      .number()
      .finite()
      .positive()
      .max(1_000_000_000),

    reason: z.enum(REFUND_REASONS),

    customerNote: noteSchema,

    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(200)
      .regex(
        /^[a-zA-Z0-9._:-]+$/,
        "Idempotency key contains unsupported characters.",
      ),
  })
  .strict()
  .superRefine((data, ctx) => {
    const sourceCount = [
      data.cancellationId,
      data.returnId,
    ].filter(Boolean).length;

    if (sourceCount > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["returnId"],
        message:
          "A refund may reference either a cancellation or a return, not both.",
      });
    }
  });

export const processRefundSchema = z
  .object({
    internalNote: z
      .string()
      .trim()
      .max(2000)
      .optional(),
  })
  .strict();

export const refundQuerySchema = z
  .object({
    status: z.enum(REFUND_STATUSES).optional(),

    orderId: objectIdSchema.optional(),

    userId: objectIdSchema.optional(),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    sort: z
      .enum(["newest", "oldest"])
      .default("newest"),
  })
  .strict();

export type CreateRefundBody = z.infer<
  typeof createRefundSchema
>;

export type ProcessRefundBody = z.infer<
  typeof processRefundSchema
>;

export type RefundQuery = z.infer<
  typeof refundQuerySchema
>;
