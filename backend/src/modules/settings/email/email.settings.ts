import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Email Settings Schema
|--------------------------------------------------------------------------
|
| Stores public-facing email sender preferences only.
| SMTP credentials and provider secrets must never be stored
| in generic Settings documents.
|
*/

export const emailSettingsSchema = z
    .object({
        enabled: z
            .boolean()
            .optional(),

        fromName: z
            .string()
            .trim()
            .min(1)
            .max(120)
            .optional(),

        fromEmail: z
            .email()
            .optional(),

        replyToEmail: z
            .email()
            .optional(),
    })
    .strict();

export type EmailSettings = z.infer<
    typeof emailSettingsSchema
>;

export const DEFAULT_EMAIL_SETTINGS = {
    enabled: false,
    fromName: "NOPTRIX",
} satisfies EmailSettings;
