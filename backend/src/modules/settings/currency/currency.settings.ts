import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Currency Settings Schema
|--------------------------------------------------------------------------
|
| Stores the platform's default currency display configuration.
| Currency records and exchange rates belong to their own modules.
|
*/

export const currencySettingsSchema = z
    .object({
        defaultCurrency: z
            .string()
            .trim()
            .regex(/^[A-Z]{3}$/)
            .optional(),

        displaySymbol: z
            .string()
            .trim()
            .min(1)
            .max(8)
            .optional(),

        decimalPlaces: z
            .number()
            .int()
            .min(0)
            .max(4)
            .optional(),

        symbolPosition: z
            .enum(["before", "after"])
            .optional(),
    })
    .strict();

export type CurrencySettings = z.infer<
    typeof currencySettingsSchema
>;

export const DEFAULT_CURRENCY_SETTINGS = {
    defaultCurrency: "BDT",
    displaySymbol: "৳",
    decimalPlaces: 2,
    symbolPosition: "before",
} satisfies CurrencySettings;
