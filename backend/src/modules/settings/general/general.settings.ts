import { z } from "zod";

/*
|--------------------------------------------------------------------------
| General Settings Schema
|--------------------------------------------------------------------------
|
| Public-facing platform configuration only.
| Never store provider credentials or private secrets here.
|
*/

export const generalSettingsSchema = z
  .object({
    platformName: z.string().trim().min(1).max(120).optional(),

    logoUrl: z.string().trim().max(2048).optional(),

    logoPublicId: z.string().trim().max(255).optional(),

    faviconUrl: z.string().trim().max(2048).optional(),

    supportEmail: z.email().optional(),

    supportPhone: z.string().trim().max(40).optional(),

    websiteUrl: z.url().optional(),

    defaultLanguage: z.string().trim().min(2).max(10).optional(),

    timezone: z.string().trim().min(1).max(100).optional(),

    maintenanceMode: z.boolean().optional(),
  })
  .strict();

export type GeneralSettings = z.infer<typeof generalSettingsSchema>;

export const DEFAULT_GENERAL_SETTINGS = {
  platformName: "NOPTRIX",
  defaultLanguage: "en",
  timezone: "UTC",
  maintenanceMode: false,
} satisfies GeneralSettings;
