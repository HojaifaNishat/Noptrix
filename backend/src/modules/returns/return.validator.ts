import { z } from "zod";

import {
  RETURN_REASONS,
  RETURN_RESOLUTIONS,
  RETURN_STATUSES,
} from "./return.types";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

const positiveIntegerSchema = z
  .number()
  .int()
  .positive()
  .max(1000);

const noteSchema = z
  .string()
  .trim()
  .max(1000)
  .optional();

const evidenceUrlsSchema = z
  .array(z.string().url().max(2048))
  .max(5)
  .optional()
  .default([]);

export const returnIdParamsSchema = z.object({
  returnId: objectIdSchema,
});

export const createReturnSchema = z
  .object({
    orderId: objectIdSchema,

    resolution: z.enum(RETURN_RESOLUTIONS),

    customerNote: noteSchema,

    items: z
      .array(
        z
          .object({
            orderItemId: objectIdSchema,

            quantity: positiveIntegerSchema,

            reason: z.enum(RETURN_REASONS),

            customerNote: noteSchema,

            evidenceUrls: evidenceUrlsSchema,
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();

export const reviewReturnSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),

    approvedRefundAmount: z
      .number()
      .finite()
      .nonnegative()
      .optional(),

    reviewNote: noteSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.status === "APPROVED" &&
      data.approvedRefundAmount === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["approvedRefundAmount"],
        message: "Approved refund amount is required when approving a return.",
      });
    }

    if (
      data.status === "REJECTED" &&
      data.approvedRefundAmount !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["approvedRefundAmount"],
        message: "A rejected return cannot have an approved refund amount.",
      });
    }
  });

export const inspectReturnSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            orderItemId: objectIdSchema,

            receivedQuantity: z
              .number()
              .int()
              .min(0)
              .max(1000),

            acceptedQuantity: z
              .number()
              .int()
              .min(0)
              .max(1000),

            inspectionNote: z.string().trim().max(1000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),

    inspectionNote: noteSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    data.items.forEach((item, index) => {
      if (item.acceptedQuantity > item.receivedQuantity) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "acceptedQuantity"],
          message: "Accepted quantity cannot exceed received quantity.",
        });
      }
    });
  });

export const returnQuerySchema = z
  .object({
    status: z.enum(RETURN_STATUSES).optional(),

    orderId: objectIdSchema.optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    sort: z
      .enum(["newest", "oldest"])
      .default("newest"),
  })
  .strict();

export type CreateReturnBody = z.infer<
  typeof createReturnSchema
>;

export type ReviewReturnBody = z.infer<
  typeof reviewReturnSchema
>;

export type InspectReturnBody = z.infer<
  typeof inspectReturnSchema
>;

export type ReturnQuery = z.infer<
  typeof returnQuerySchema
>;
