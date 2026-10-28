import { z } from "zod";
import {
  MARKETING_CHANNELS,
  MARKETING_STATUSES,
} from "./marketing-campaign.model";

export const createMarketingCampaignSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  subject: z.string().trim().max(300).optional(),
  message: z.string().trim().min(1).max(10000),
  htmlContent: z.string().max(50000).optional(),
  scheduledAt: z.string().datetime().optional(),
  audience: z
    .object({
      userStatuses: z
        .array(z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"]))
        .max(4)
        .optional(),
      verifiedEmailOnly: z.boolean().optional(),
      verifiedPhoneOnly: z.boolean().optional(),
    })
    .optional(),
});

export const updateMarketingCampaignSchema =
  createMarketingCampaignSchema.partial();

export const campaignIdParamSchema = z.object({
  campaignId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const marketingCampaignQuerySchema = z.object({
  status: z.enum(MARKETING_STATUSES).optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const marketingStatusSchema = z.object({
  status: z.enum(["DRAFT", "READY", "PAUSED", "ARCHIVED"]),
});

export { MARKETING_CHANNELS };
