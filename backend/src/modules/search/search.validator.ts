import { z } from "zod";
import { SEARCH_SORT_OPTIONS } from "./search.types";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const productSearchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),

    categoryId: objectIdSchema.optional(),
    subcategoryId: objectIdSchema.optional(),
    brandId: objectIdSchema.optional(),

    minPrice: z.coerce.number().finite().min(0).optional(),
    maxPrice: z.coerce.number().finite().min(0).optional(),

    featured: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    inStock: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),

    sortBy: z.enum(SEARCH_SORT_OPTIONS).default("relevance"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minPrice"],
        message: "minPrice cannot exceed maxPrice",
      });
    }
  });

export const searchSuggestionQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(80),
    limit: z.coerce.number().int().min(1).max(10).default(5),
  })
  .strict();

export const popularSearchQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(20).default(10),
  })
  .strict();

export type ProductSearchQuery = z.infer<typeof productSearchQuerySchema>;

export type SearchSuggestionQuery = z.infer<typeof searchSuggestionQuerySchema>;
