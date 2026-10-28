import { z } from "zod";

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, {
  message: "Invalid MongoDB ObjectId.",
});

export const productImageParamsSchema = z.object({
  productId: mongoIdSchema,
});

export const productImageIdParamsSchema = z.object({
  productId: mongoIdSchema,
  id: mongoIdSchema,
});

export const imageUploadBodySchema = z
  .object({
    alt: z.string().trim().max(250).optional(),
    primaryIndex: z.coerce.number().int().min(0).max(19).optional(),
  })
  .strict();

export const imageUpdateBodySchema = z
  .object({
    alt: z.string().trim().max(250).optional(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one image field must be provided.",
  });

export const imageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ImageUploadBody = z.infer<typeof imageUploadBodySchema>;
export type ImageUpdateBody = z.infer<typeof imageUpdateBodySchema>;
export type ImageListQuery = z.infer<typeof imageListQuerySchema>;
