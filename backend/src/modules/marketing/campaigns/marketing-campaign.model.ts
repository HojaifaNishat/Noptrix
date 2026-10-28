import { Schema, model, models, type Model } from "mongoose";

export const MARKETING_CHANNELS = ["GENERAL", "EMAIL", "SMS", "PUSH"] as const;

export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export const MARKETING_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "READY",
  "SENDING",
  "SENT",
  "PARTIAL",
  "FAILED",
  "PAUSED",
  "ARCHIVED",
] as const;

export type MarketingStatus = (typeof MARKETING_STATUSES)[number];

export interface IMarketingCampaign {
  name: string;
  description?: string;
  channel: MarketingChannel;
  status: MarketingStatus;
  subject?: string;
  message: string;
  htmlContent?: string;
  audience: {
    userStatuses: string[];
    verifiedEmailOnly: boolean;
    verifiedPhoneOnly: boolean;
  };
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  stats: {
    recipients: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketingCampaignSchema = new Schema<IMarketingCampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    channel: {
      type: String,
      enum: MARKETING_CHANNELS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: MARKETING_STATUSES,
      default: "DRAFT",
      index: true,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    message: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    htmlContent: {
      type: String,
      maxlength: 50000,
    },
    audience: {
      userStatuses: {
        type: [String],
        default: ["ACTIVE"],
      },
      verifiedEmailOnly: {
        type: Boolean,
        default: true,
      },
      verifiedPhoneOnly: {
        type: Boolean,
        default: true,
      },
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    stats: {
      recipients: { type: Number, default: 0, min: 0 },
      successful: { type: Number, default: 0, min: 0 },
      failed: { type: Number, default: 0, min: 0 },
      skipped: { type: Number, default: 0, min: 0 },
    },
    createdBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "marketing_campaigns",
  },
);

marketingCampaignSchema.index({
  channel: 1,
  status: 1,
  createdAt: -1,
});

marketingCampaignSchema.index({
  scheduledAt: 1,
  status: 1,
});

export const MarketingCampaign =
  (models.MarketingCampaign as Model<IMarketingCampaign>) ||
  model<IMarketingCampaign>("MarketingCampaign", marketingCampaignSchema);
