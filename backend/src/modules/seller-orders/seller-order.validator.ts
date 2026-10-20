import { z } from "zod";

import {
  ORDER_STATUSES,
  ORDER_PAYMENT_STATUSES,
} from "../orders/order.types";

/**
 * MongoDB ObjectId validation
 */
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

/**
 * GET /seller-orders
 *
 * Query parameters:
 * page, limit, status, paymentStatus, search, sort
 */
export const sellerOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  status: z.enum(ORDER_STATUSES).optional(),

  paymentStatus: z.enum(ORDER_PAYMENT_STATUSES).optional(),

  search: z.string().trim().max(100).optional(),

  sort: z.enum(["newest", "oldest"]).default("newest"),
});

/**
 * GET /seller-orders/:orderId
 */
export const sellerOrderIdParamSchema = z.object({
  orderId: objectIdSchema,
});

/**
 * Inferred types
 */
export type SellerOrderQueryInput = z.infer<
  typeof sellerOrderQuerySchema
>;

export type SellerOrderIdParamInput = z.infer<
  typeof sellerOrderIdParamSchema
>;