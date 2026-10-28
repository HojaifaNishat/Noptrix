import { z } from "zod";

/*
|--------------------------------------------------------------------------
| SMS Settings Schema
|--------------------------------------------------------------------------
|
| Stores SMS notification preferences only.
| Provider credentials and API secrets must be managed
| by a dedicated integration/secret-management layer.
|
*/

export const smsSettingsSchema = z
  .object({
    enabled: z.boolean().optional(),

    senderId: z.string().trim().min(1).max(40).optional(),
  })
  .strict();

export type SmsSettings = z.infer<typeof smsSettingsSchema>;

export const DEFAULT_SMS_SETTINGS = {
  enabled: false,
} satisfies SmsSettings;
