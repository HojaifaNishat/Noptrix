import { z } from "zod";

export const businessSettingsSchema = z
    .object({
        legalName: z
            .string()
            .trim()
            .min(1)
            .max(160)
            .optional(),

        address: z
            .string()
            .trim()
            .max(500)
            .optional(),

        country: z
            .string()
            .trim()
            .max(100)
            .optional(),

        allowGuestCheckout: z
            .boolean()
            .optional(),

        minOrderAmount: z
            .number()
            .finite()
            .min(0)
            .optional(),

        cancellationWindowMinutes: z
            .number()
            .int()
            .min(0)
            .max(10080)
            .optional(),
    })
    .strict();

export type BusinessSettings = z.infer<
    typeof businessSettingsSchema
>;

export const DEFAULT_BUSINESS_SETTINGS = {
    allowGuestCheckout: true,
    minOrderAmount: 0,
    cancellationWindowMinutes: 30,
} satisfies BusinessSettings;
