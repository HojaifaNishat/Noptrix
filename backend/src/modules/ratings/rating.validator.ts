import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID.");

export const createRatingSchema = z.object({
  productId: objectId,
  value: z.coerce.number().int().min(1).max(5),
});

export const updateRatingSchema = z.object({
  value: z.coerce.number().int().min(1).max(5),
});

export const ratingProductParamsSchema = z.object({
  productId: objectId,
});

export const ratingIdParamsSchema = z.object({
  ratingId: objectId,
});

export const ratingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  value: z.coerce.number().int().min(1).max(5).optional(),
});
