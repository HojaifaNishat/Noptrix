import { z } from "zod";

const dateSchema = z.coerce.date();

const codeSchema = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .regex(/^[A-Za-z0-9_-]+$/)
  .transform((value) => value.toUpperCase());

export const createCouponSchema = z.object({
  body: z
    .object({
      code: codeSchema,
      description: z.string().trim().max(500).optional(),
      discountType: z.enum(["PERCENTAGE", "FIXED"]),
      discountValue: z.number().positive(),
      minimumOrderAmount: z.number().nonnegative().default(0),
      maximumDiscountAmount: z.number().positive().optional(),
      usageLimit: z.number().int().positive().optional(),
      usageLimitPerUser: z.number().int().positive().optional(),
      startsAt: dateSchema,
      expiresAt: dateSchema,
      status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (value.discountType === "PERCENTAGE" && value.discountValue > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Percentage discount cannot exceed 100.",
        });
      }

      if (value.expiresAt <= value.startsAt) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresAt"],
          message: "Expiry must be later than the start date.",
        });
      }
    }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    couponId: z.string().regex(/^[a-f\d]{24}$/i),
  }),
  body: z
    .object({
      description: z.string().trim().max(500).optional(),
      discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
      discountValue: z.number().positive().optional(),
      minimumOrderAmount: z.number().nonnegative().optional(),
      maximumDiscountAmount: z.number().positive().nullable().optional(),
      usageLimit: z.number().int().positive().nullable().optional(),
      usageLimitPerUser: z.number().int().positive().nullable().optional(),
      startsAt: dateSchema.optional(),
      expiresAt: dateSchema.optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (
        value.discountType === "PERCENTAGE" &&
        value.discountValue !== undefined &&
        value.discountValue > 100
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Percentage discount cannot exceed 100.",
        });
      }

      if (
        value.startsAt &&
        value.expiresAt &&
        value.expiresAt <= value.startsAt
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresAt"],
          message: "Expiry must be later than the start date.",
        });
      }
    }),
});

export const couponIdParamsSchema = z.object({
  couponId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const validateCouponSchema = z.object({
  body: z
    .object({
      code: codeSchema,
      subtotal: z.number().finite().nonnegative(),
    })
    .strict(),
});

export const couponListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    search: z.string().trim().max(100).optional(),
  }),
});
