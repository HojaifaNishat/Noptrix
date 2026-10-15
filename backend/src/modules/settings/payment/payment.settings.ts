import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Payment Settings Schema
|--------------------------------------------------------------------------
|
| Stores platform-level payment policy flags only.
| Gateway credentials and payment method configuration belong
| to dedicated payment modules.
|
*/

export const paymentSettingsSchema = z
    .object({
        allowCashOnDelivery: z
            .boolean()
            .optional(),

        allowOnlinePayments: z
            .boolean()
            .optional(),
    })
    .strict();

export type PaymentSettings = z.infer<
    typeof paymentSettingsSchema
>;

export const DEFAULT_PAYMENT_SETTINGS = {
    allowCashOnDelivery: true,
    allowOnlinePayments: false,
} satisfies PaymentSettings;
