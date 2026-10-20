import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId.");

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8, "Idempotency key must contain at least 8 characters.")
  .max(200)
  .regex(
    /^[a-zA-Z0-9._:-]+$/,
    "Idempotency key contains unsupported characters.",
  );

const checkoutTokenSchema = z
  .string()
  .trim()
  .min(16)
  .max(200)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid checkout token.");

export const checkoutIdParamsSchema = z.object({
  checkoutId: objectIdSchema,
});

export const createCheckoutSchema = z
  .object({
    addressId: objectIdSchema,
    billingAddressId: objectIdSchema.optional(),
    shippingMethod: z.string().trim().min(1).max(100).optional(),
    paymentMethod: z.string().trim().min(1).max(100),
    couponCode: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .transform((value) => value.toUpperCase())
      .optional(),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict();

export const confirmCheckoutSchema = z
  .object({
    checkoutToken: checkoutTokenSchema,
  })
  .strict();

export const cancelCheckoutSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const checkoutQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
      "EXPIRED",
    ])
    .optional(),
  paymentStatus: z
    .enum([
      "PENDING",
      "AUTHORIZED",
      "PAID",
      "FAILED",
      "REFUNDED",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export const checkoutTokenParamsSchema = z.object({
  checkoutToken: checkoutTokenSchema,
});

export type CreateCheckoutInput = z.infer<
  typeof createCheckoutSchema
>;

export type ConfirmCheckoutInput = z.infer<
  typeof confirmCheckoutSchema
>;

export type CancelCheckoutInput = z.infer<
  typeof cancelCheckoutSchema
>;

export type CheckoutQueryInput = z.infer<
  typeof checkoutQuerySchema
>;
