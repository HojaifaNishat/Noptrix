import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

export const orderIdParamsSchema = z.object({
  orderId: objectIdSchema,
});

export const createOrderSchema = z
  .object({
    checkoutId: objectIdSchema,
  })
  .strict();

export const orderQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
    ])
    .optional(),

  paymentStatus: z
    .enum([
      "PENDING",
      "AUTHORIZED",
      "PAID",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
      "FAILED",
    ])
    .optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  search: z.string().trim().max(100).optional(),

  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export const updateOrderStatusSchema = z
  .object({
    status: z.enum([
      "CONFIRMED",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ]),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const cancelOrderSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(3, "Please provide a cancellation reason.")
      .max(1000),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
