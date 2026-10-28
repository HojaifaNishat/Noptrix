import { z } from "zod";

const codeSchema = z
  .string()
  .trim()
  .min(8)
  .max(40)
  .regex(/^[A-Za-z0-9-]+$/);

export const createGiftCardSchema = z.object({
  body: z.object({
    initialBalance: z.number().finite().positive().max(10000000),
    currency: z.string().trim().length(3).default("BDT"),
    expiresAt: z.coerce.date().nullable().optional(),
    recipientEmail: z.string().trim().email().optional(),
    recipientName: z.string().trim().max(120).optional(),
    note: z.string().trim().max(500).optional(),
  }),
});

export const giftCardIdParamsSchema = z.object({
  params: z.object({
    giftCardId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid gift card ID"),
  }),
});

export const giftCardListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "DEPLETED"]).optional(),
  }),
});

export const giftCardBalanceSchema = z.object({
  body: z.object({
    code: codeSchema,
  }),
});

export const giftCardStatusSchema = z.object({
  params: z.object({
    giftCardId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid gift card ID"),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
});
