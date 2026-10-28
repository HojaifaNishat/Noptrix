import { z } from "zod";
import { BRAND_STATUSES } from "./brand.model";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const httpUrl = (value: string): boolean => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const optionalUrl = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(httpUrl, `${label} must be a valid HTTP(S) URL.`)
    .optional();

const seoSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().min(1).max(320).optional(),
  })
  .strict();

const statusSchema = z.enum(BRAND_STATUSES);

export const createBrandSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(160)
      .regex(slugRegex)
      .optional(),
    description: z.string().trim().max(3000).optional(),
    logo: optionalUrl("Logo", 2048),
    website: optionalUrl("Website", 2048),
    status: statusSchema.optional(),
    sortOrder: z.number().int().min(0).max(1_000_000).optional(),
    seo: seoSchema.optional(),
  })
  .strict();

export const updateBrandSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(160)
      .regex(slugRegex)
      .optional(),
    description: z.string().trim().max(3000).optional(),
    logo: optionalUrl("Logo", 2048),
    website: optionalUrl("Website", 2048),
    status: statusSchema.optional(),
    sortOrder: z.number().int().min(0).max(1_000_000).optional(),
    seo: seoSchema.optional(),
    removeLogo: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  });

export const brandIdParamSchema = z
  .object({
    brandId: z.string().regex(objectIdRegex, "Invalid brand ID."),
  })
  .strict();

export const brandSlugParamSchema = z
  .object({
    slug: z.string().trim().min(2).max(160).regex(slugRegex),
  })
  .strict();

export const brandListQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: statusSchema.optional(),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
      .enum(["name", "sortOrder", "createdAt", "updatedAt"])
      .default("sortOrder"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

export const updateBrandStatusSchema = z
  .object({
    status: statusSchema,
  })
  .strict();

export const updateBrandSortOrderSchema = z
  .object({
    sortOrder: z.number().int().min(0).max(1_000_000),
  })
  .strict();

export type CreateBrandValidated = z.infer<typeof createBrandSchema>;
export type UpdateBrandValidated = z.infer<typeof updateBrandSchema>;
export type BrandListValidated = z.infer<typeof brandListQuerySchema>;
