import { z } from "zod";

export const loyaltyTierSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/),

    name: z.string().trim().min(2).max(80),

    minLifetimePoints: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),

    earningMultiplier: z.number().min(0).max(10),

    benefits: z.array(z.string().trim().min(1).max(200)).max(20).default([]),

    sortOrder: z.number().int().min(0).max(10000),

    active: z.boolean().default(true),
  })
  .strict();

export const updateLoyaltyProgramSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),

    description: z.string().trim().max(2000).optional(),

    enabled: z.boolean().optional(),

    pointsPerCurrencyUnit: z.number().min(0).max(1000).optional(),

    minimumOrderAmount: z.number().min(0).optional(),

    pointsExpiryDays: z.number().int().min(1).nullable().optional(),

    tiers: z.array(loyaltyTierSchema).min(1).max(20).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.tiers) return;

    const keys = data.tiers.map((tier) => tier.key.toUpperCase());

    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["tiers"],
        message: "Tier keys must be unique.",
      });
    }

    const activeThresholds = data.tiers
      .filter((tier) => tier.active)
      .map((tier) => tier.minLifetimePoints);

    if (new Set(activeThresholds).size !== activeThresholds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["tiers"],
        message: "Active tier thresholds must be unique.",
      });
    }
  });

export const loyaltyProgramKeySchema = z
  .object({
    key: z.string().trim().min(2).max(30),
  })
  .strict();

export type UpdateLoyaltyProgramInput = z.infer<
  typeof updateLoyaltyProgramSchema
>;

export type LoyaltyTierInput = z.infer<typeof loyaltyTierSchema>;
