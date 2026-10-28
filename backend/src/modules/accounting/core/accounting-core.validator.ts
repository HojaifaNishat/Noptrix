import { z } from "zod";

const money = z
  .number()
  .finite()
  .min(0)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
    "Amount must have at most two decimal places.",
  );

export const accountTypes = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
] as const;

export const createAccountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((v) => v.toUpperCase()),
    name: z.string().trim().min(2).max(150),
    type: z.enum(accountTypes),
    parentId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
    description: z.string().trim().max(1000).optional(),
    isCashAccount: z.boolean().default(false),
    cashFlowCategory: z
      .enum(["OPERATING", "INVESTING", "FINANCING"])
      .optional(),
  })
  .strict()
  .refine(
    (value) => !value.isCashAccount || !value.cashFlowCategory,
    "Cash accounts cannot have a cash flow category.",
  );

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(1000).optional(),
    isActive: z.boolean().optional(),
    isCashAccount: z.boolean().optional(),
    cashFlowCategory: z
      .enum(["OPERATING", "INVESTING", "FINANCING"])
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required.",
  )
  .refine(
    (value) => !(value.isCashAccount === true && value.cashFlowCategory),
    "Cash accounts cannot have a cash flow category.",
  );

export const createJournalSchema = z
  .object({
    entryDate: z.coerce.date(),
    description: z.string().trim().min(2).max(1000),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/)
      .transform((v) => v.toUpperCase()),
    referenceType: z.string().trim().max(50).optional(),
    referenceId: z.string().trim().max(150).optional(),
    lines: z
      .array(
        z
          .object({
            accountId: z.string().regex(/^[a-f\d]{24}$/i),
            description: z.string().trim().max(500).optional(),
            debit: money,
            credit: money,
          })
          .strict()
          .refine(
            (line) => line.debit > 0 !== line.credit > 0,
            "Each line must have either a debit or a credit, but not both.",
          ),
      )
      .min(2)
      .max(200),
  })
  .strict();

export const listAccountsQuerySchema = z
  .object({
    type: z.enum(accountTypes).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    search: z.string().trim().max(150).optional(),
  })
  .strict();

export const listJournalQuerySchema = z
  .object({
    status: z.enum(["DRAFT", "POSTED", "REVERSED"]).optional(),
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

export const reverseJournalSchema = z
  .object({
    entryDate: z.coerce.date().optional(),
    description: z.string().trim().min(2).max(1000).optional(),
  })
  .strict();

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export const listLedgerQuerySchema = z
  .object({
    accountId: z.string().regex(/^[a-f\d]{24}$/i),
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
