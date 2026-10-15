import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shipping Settings Schema
|--------------------------------------------------------------------------
|
| Stores default shipping policy and delivery estimates.
| Delivery zones, fees and carrier integrations belong
| to their dedicated modules.
|
*/

export const shippingSettingsSchema = z
    .object({
        freeShippingEnabled: z
            .boolean()
            .optional(),

        freeShippingThreshold: z
            .number()
            .finite()
            .min(0)
            .optional(),

        estimatedDeliveryMinDays: z
            .number()
            .int()
            .min(0)
            .max(365)
            .optional(),

        estimatedDeliveryMaxDays: z
            .number()
            .int()
            .min(0)
            .max(365)
            .optional(),
    })
    .strict()
    .superRefine((values, ctx) => {
        const minDays = values.estimatedDeliveryMinDays;
        const maxDays = values.estimatedDeliveryMaxDays;

        if (
            minDays !== undefined &&
            maxDays !== undefined &&
            minDays > maxDays
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["estimatedDeliveryMaxDays"],
                message:
                    "Maximum delivery days must be greater than or equal to minimum delivery days.",
            });
        }
    });

export type ShippingSettings = z.infer<
    typeof shippingSettingsSchema
>;

export const DEFAULT_SHIPPING_SETTINGS = {
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
    estimatedDeliveryMinDays: 3,
    estimatedDeliveryMaxDays: 7,
} satisfies ShippingSettings;
