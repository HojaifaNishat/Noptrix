import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const wishlistIdSchema = z.object({
  wishlistId: objectIdSchema,
});

export const wishlistItemParamsSchema = z.object({
  wishlistId: objectIdSchema,
  itemId: objectIdSchema,
});

export const wishlistProductParamsSchema = z.object({
  wishlistId: objectIdSchema,
  productId: objectIdSchema,
});

export const createWishlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .default("My Wishlist"),
  description: z.string().trim().max(500).optional(),
});

export const updateWishlistSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined,
    { message: "At least one field must be provided" },
  );

export const addWishlistItemSchema = z.object({
  productId: objectIdSchema,
  variantId: objectIdSchema.optional(),
});

export const wishlistQuerySchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const wishlistItemIdSchema = z.object({
  itemId: objectIdSchema,
});

export const archiveWishlistSchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export type CreateWishlistInput =
  z.infer<typeof createWishlistSchema>;

export type UpdateWishlistInput =
  z.infer<typeof updateWishlistSchema>;

export type AddWishlistItemInput =
  z.infer<typeof addWishlistItemSchema>;

export type WishlistQueryInput =
  z.infer<typeof wishlistQuerySchema>;
