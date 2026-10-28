import { z } from "zod";
import { REVIEW_STATUSES } from "./review.types";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, {
  message: "Invalid ID",
});

export const createReviewSchema = z.object({
  productId: objectIdSchema,
  orderId: objectIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(3).max(3000),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: z.string().trim().max(120).optional(),
    comment: z.string().trim().min(3).max(3000).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "At least one field must be provided",
  });

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  status: z
    .enum([
      REVIEW_STATUSES.PENDING,
      REVIEW_STATUSES.APPROVED,
      REVIEW_STATUSES.REJECTED,
    ])
    .optional(),
  productId: objectIdSchema.optional(),
});

export const reviewIdParamsSchema = z.object({
  reviewId: objectIdSchema,
});

export const moderateReviewSchema = z.object({
  status: z.enum([REVIEW_STATUSES.APPROVED, REVIEW_STATUSES.REJECTED]),
});
