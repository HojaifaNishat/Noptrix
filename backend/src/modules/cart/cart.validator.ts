import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const cartIdSchema = z.object({
  id: objectIdSchema,
});

export const addCartItemSchema = z.object({
  productId: objectIdSchema,
  variantId: objectIdSchema.optional(),
  quantity: z.coerce.number().int().min(1).max(1000).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(1000),
});

export const cartItemParamsSchema = z.object({
  itemId: objectIdSchema,
});

export const cartProductParamsSchema = z.object({
  productId: objectIdSchema,
});

export const cartVariantParamsSchema = z.object({
  productId: objectIdSchema,
  variantId: objectIdSchema,
});

export const cartQuerySchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const applyCartCouponSchema = z.object({
  couponCode: z.string().trim().min(1).max(50).transform((value) => value.toUpperCase()),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCartCouponInput = z.infer<typeof applyCartCouponSchema>;
