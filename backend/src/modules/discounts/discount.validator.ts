import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

const discountFields = {
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minimumOrderAmount: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().min(0).nullable().optional(),
  targetType: z.enum(["ALL", "PRODUCTS", "CATEGORIES"]).optional(),
  productIds: z.array(objectId).optional(),
  categoryIds: z.array(objectId).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  priority: z.number().int().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
};

export const createDiscountSchema = z.object({
  body: z.object(discountFields),
});

export const updateDiscountSchema = z.object({
  params: z.object({ discountId: objectId }),
  body: z
    .object({
      name: discountFields.name.optional(),
      description: discountFields.description,
      type: discountFields.type.optional(),
      value: discountFields.value.optional(),
      minimumOrderAmount: discountFields.minimumOrderAmount,
      maximumDiscountAmount: discountFields.maximumDiscountAmount,
      targetType: discountFields.targetType,
      productIds: discountFields.productIds,
      categoryIds: discountFields.categoryIds,
      startsAt: discountFields.startsAt.optional(),
      endsAt: discountFields.endsAt,
      usageLimit: discountFields.usageLimit,
      priority: discountFields.priority,
      status: discountFields.status,
    })
    .strict(),
});

export const discountIdParamsSchema = z.object({
  params: z.object({ discountId: objectId }),
});

export const discountListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  }),
});
