import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const faqCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().toLowerCase().regex(slugRegex).optional(),
    description: z.string().trim().max(1000).default(""),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(1000000).optional(),
  })
  .strict();

export const faqSchema = z
  .object({
    question: z.string().trim().min(5).max(300),
    answer: z.string().trim().min(2).max(10000),
    categoryId: z.string().regex(objectIdRegex),
    isPublished: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(1000000).optional(),
  })
  .strict();

export const faqIdSchema = z.object({
  id: z.string().regex(objectIdRegex),
});

export const faqListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(120).optional(),
    categoryId: z.string().regex(objectIdRegex).optional(),
  })
  .strict();

export const faqPublishSchema = z
  .object({
    isPublished: z.boolean(),
  })
  .strict();
