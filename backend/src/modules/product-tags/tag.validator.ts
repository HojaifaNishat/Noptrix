import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may contain lowercase letters, numbers and hyphens",
  );

export const tagCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: slugSchema.optional(),
    description: z.string().trim().max(500).optional(),
  })
  .strict();

export const tagUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: slugSchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const tagIdParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const productIdParamsSchema = z
  .object({
    productId: objectIdSchema,
  })
  .strict();

export const productTagAssignmentParamsSchema = z
  .object({
    productId: objectIdSchema,
    tagId: objectIdSchema,
  })
  .strict();

export const assignTagSchema = z
  .object({
    productId: objectIdSchema,
    tagId: objectIdSchema,
  })
  .strict();

export const listTagsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(150).optional(),
  })
  .strict();
