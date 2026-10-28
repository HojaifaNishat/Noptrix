import { z } from "zod";

import { COLLECTION_STATUSES } from "./collection.types";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(
    /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/,
    "Slug may contain letters, numbers, and hyphens only.",
  );

const productIdsSchema = z
  .array(z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid product ID."))
  .max(500)
  .refine(
    (ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length,
    "Duplicate product IDs are not allowed.",
  );

export const createCollectionSchema = z
  .object({
    name: z.string().trim().min(2).max(120),

    slug: slugSchema.optional(),

    description: z.string().trim().max(5000).optional(),

    image: z.string().trim().url().max(2048).optional(),

    products: productIdsSchema.optional(),

    status: z.enum(COLLECTION_STATUSES).optional(),

    isFeatured: z.boolean().optional(),

    sortOrder: z.number().int().min(0).max(100000).optional(),

    seoTitle: z.string().trim().max(160).optional(),

    seoDescription: z.string().trim().max(320).optional(),
  })
  .strict();

export const updateCollectionSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),

    slug: slugSchema.optional(),

    description: z.string().trim().max(5000).optional(),

    image: z.string().trim().url().max(2048).optional(),

    products: productIdsSchema.optional(),

    status: z.enum(COLLECTION_STATUSES).optional(),

    isFeatured: z.boolean().optional(),

    sortOrder: z.number().int().min(0).max(100000).optional(),

    seoTitle: z.string().trim().max(160).optional(),

    seoDescription: z.string().trim().max(320).optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided.",
  );

export const collectionIdParamsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid collection ID."),
});

export const collectionSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(160),
});

export const collectionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  search: z.string().trim().max(120).optional(),

  status: z.enum(COLLECTION_STATUSES).optional(),

  isFeatured: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  sortBy: z
    .enum(["name", "createdAt", "updatedAt", "sortOrder"])
    .default("sortOrder"),

  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const collectionProductIdsSchema = z
  .object({
    productIds: productIdsSchema.min(1),
  })
  .strict();
