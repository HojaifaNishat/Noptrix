import { z } from "zod";

export const accountingRecordListQuerySchema = z
  .object({
    status: z.enum(["DRAFT", "APPROVED", "REJECTED"]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict()
  .refine(
    (value) => !value.from || !value.to || value.from <= value.to,
    "Start date must be before end date.",
  );

export const accountingReportQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/)
      .transform((value) => value.toUpperCase())
      .optional(),
  })
  .strict()
  .refine(
    (value) => !value.from || !value.to || value.from <= value.to,
    "Start date must be before end date.",
  );

export const accountingRecordSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).optional(),
    amount: z
      .number()
      .finite()
      .positive()
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
        "Amount must have at most two decimal places.",
      ),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/)
      .transform((value) => value.toUpperCase()),
    occurredAt: z.coerce.date(),
    category: z.string().trim().max(100).optional(),
    accountId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
    reference: z.string().trim().max(150).optional(),
  })
  .strict();

export const accountingRecordIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export const updateAccountingRecordSchema = accountingRecordSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided.",
  );
