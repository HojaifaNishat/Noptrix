import { z } from "zod";
import { PROMOTION_STATUSES, PROMOTION_TYPES } from "./promotion.types";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const dateString = z.string().datetime({ offset: true });

const optionalPositiveNumber = z.number().positive().optional();

export const createPromotionSchema = z
  .object({
    title: z.string().trim().min(2).max(150),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(PROMOTION_TYPES),
    value: z.number().positive(),
    currency: z.string().trim().length(3).default("BDT"),
    maxDiscountAmount: optionalPositiveNumber,
    minOrderAmount: z.number().min(0).default(0),
    startsAt: dateString,
    endsAt: dateString,
    applicableProductIds: z.array(objectId).default([]),
    applicableCategoryIds: z.array(objectId).default([]),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    isStackable: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENTAGE" && data.value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage cannot exceed 100",
      });
    }

    if (new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "endsAt must be later than startsAt",
      });
    }
  });

export const updatePromotionSchema = z
  .object({
    title: z.string().trim().min(2).max(150).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(PROMOTION_TYPES).optional(),
    value: z.number().positive().optional(),
    currency: z.string().trim().length(3).optional(),
    maxDiscountAmount: optionalPositiveNumber,
    minOrderAmount: z.number().min(0).optional(),
    startsAt: dateString.optional(),
    endsAt: dateString.optional(),
    applicableProductIds: z.array(objectId).optional(),
    applicableCategoryIds: z.array(objectId).optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    isStackable: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.type === "PERCENTAGE" &&
      data.value !== undefined &&
      data.value > 100
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage cannot exceed 100",
      });
    }

    if (
      data.startsAt &&
      data.endsAt &&
      new Date(data.endsAt) <= new Date(data.startsAt)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "endsAt must be later than startsAt",
      });
    }
  });

export const promotionIdParamSchema = z.object({
  promotionId: objectId,
});

export const promotionQuerySchema = z.object({
  status: z.enum(PROMOTION_STATUSES).optional(),
  type: z.enum(PROMOTION_TYPES).optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const promotionStatusSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]),
});
