import { z } from "zod";

export const applyReferralSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Referral code is required")
    .max(32, "Referral code is too long")
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9-]+$/, "Invalid referral code format")),
});

export const referralHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "QUALIFIED", "REWARDED", "REJECTED"]).optional(),
});

export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;
export type ReferralHistoryInput = z.infer<typeof referralHistoryQuerySchema>;
