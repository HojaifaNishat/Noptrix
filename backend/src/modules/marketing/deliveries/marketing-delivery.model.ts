import { Schema, model, models, type Model, Types } from "mongoose";
import type { ConsentChannel } from "../consent/marketing-consent.model";

export const DELIVERY_STATUSES = [
  "SENDING",
  "QUEUED",
  "SENT",
  "FAILED",
  "SKIPPED",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface IMarketingDelivery {
  campaignId: Types.ObjectId;
  userId: Types.ObjectId;
  channel: ConsentChannel;
  status: DeliveryStatus;
  providerMessageId?: string;
  error?: string;
  attemptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMarketingDelivery>(
  {
    campaignId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    channel: { type: String, enum: ["EMAIL", "SMS", "PUSH"], required: true },
    status: {
      type: String,
      enum: DELIVERY_STATUSES,
      required: true,
      index: true,
    },
    providerMessageId: { type: String },
    error: { type: String, maxlength: 2000 },
    attemptedAt: Date,
  },
  { timestamps: true, versionKey: false, collection: "marketing_deliveries" },
);

schema.index(
  { campaignId: 1, userId: 1, channel: 1 },
  { unique: true, name: "marketing_delivery_once_per_user" },
);

schema.index({ campaignId: 1, status: 1 });

export const MarketingDelivery =
  (models.MarketingDelivery as Model<IMarketingDelivery>) ||
  model<IMarketingDelivery>("MarketingDelivery", schema);
