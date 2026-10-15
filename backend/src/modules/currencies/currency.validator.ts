import { z } from "zod";

const currencyCodeSchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(
        /^[A-Z]{3}$/,
        "Currency code must contain exactly 3 letters.",
    );

const currencyNameSchema = z
    .string()
    .trim()
    .min(2)
    .max(100);

const currencySymbolSchema = z
    .string()
    .trim()
    .min(1)
    .max(12);

const decimalPlacesSchema = z
    .number()
    .int()
    .min(0)
    .max(4);

const currencyStatusSchema = z.enum([
    "ACTIVE",
    "INACTIVE",
]);

const objectIdSchema = z
    .string()
    .trim()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid MongoDB ObjectId.",
    );

export const createCurrencySchema = z
    .object({
        code: currencyCodeSchema,
        name: currencyNameSchema,
        symbol: currencySymbolSchema,
        decimalPlaces: decimalPlacesSchema.default(2),
    })
    .strict();

export const updateCurrencySchema = z
    .object({
        name: currencyNameSchema.optional(),
        symbol: currencySymbolSchema.optional(),
        decimalPlaces: decimalPlacesSchema.optional(),
        status: currencyStatusSchema.optional(),
    })
    .strict()
    .refine(
        (values) => Object.keys(values).length > 0,
        "At least one currency field must be provided.",
    );

export const listCurrenciesQuerySchema = z
    .object({
        status: currencyStatusSchema.optional(),
        page: z.coerce.number().int().min(1).max(1_000_000).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict();

export const currencyIdParamsSchema = z
    .object({
        currencyId: objectIdSchema,
    })
    .strict();

export type CreateCurrencyInput =
    z.infer<typeof createCurrencySchema>;

export type UpdateCurrencyInput =
    z.infer<typeof updateCurrencySchema>;

export type ListCurrenciesQuery =
    z.infer<typeof listCurrenciesQuerySchema>;
