import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Security Settings Schema
|--------------------------------------------------------------------------
|
| Stores security policy configuration only.
| Authentication services must enforce these settings separately.
|
*/

export const securitySettingsSchema = z
    .object({
        minPasswordLength: z
            .number()
            .int()
            .min(8)
            .max(128)
            .optional(),

        maxLoginAttempts: z
            .number()
            .int()
            .min(1)
            .max(20)
            .optional(),

        lockoutMinutes: z
            .number()
            .int()
            .min(1)
            .max(1440)
            .optional(),

        requireMfaForAdmins: z
            .boolean()
            .optional(),
    })
    .strict();

export type SecuritySettings = z.infer<
    typeof securitySettingsSchema
>;

export const DEFAULT_SECURITY_SETTINGS = {
    minPasswordLength: 12,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
    requireMfaForAdmins: false,
} satisfies SecuritySettings;
