import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Tax Settings Schema
|--------------------------------------------------------------------------
|
| Stores default tax policy configuration.
| Detailed tax rules and jurisdiction-specific rates belong
| to the dedicated tax module.
|
*/

export const taxSettingsSchema = z
    .object({
        enabled: z
            .boolean()
            .optional(),

        pricesIncludeTax: z
            .boolean()
            .optional(),

        defaultRate: z
            .number()
            .finite()
            .min(0)
            .max(100)
            .optional(),

        taxLabel: z
            .string()
            .trim()
            .min(1)
            .max(80)
            .optional(),
    })
    .strict();

export type TaxSettings = z.infer<
    typeof taxSettingsSchema
>;

export const DEFAULT_TAX_SETTINGS = {
    enabled: false,
    pricesIncludeTax: false,
    defaultRate: 0,
    taxLabel: "Tax",
} satisfies TaxSettings;
