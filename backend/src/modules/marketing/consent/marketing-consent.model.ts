import { Schema, model, models, type Model, Types } from "mongoose";

export const CONSENT_CHANNELS = ["EMAIL", "SMS", "PUSH"] as const;
export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

export interface IMarketingConsent {
  userId: Types.ObjectId;
  channel: ConsentChannel;
  consented: boolean;
  consentedAt?: Date;
  source?: string;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMarketingConsent>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    channel: { type: String, enum: CONSENT_CHANNELS, required: true },
    consented: { type: Boolean, default: false, required: true },
    consentedAt: Date,
    source: { type: String, trim: true, maxlength: 100 },
    unsubscribedAt: Date,
  },
  { timestamps: true, versionKey: false, collection: "marketing_consents" },
);

schema.index({ userId: 1, channel: 1 }, { unique: true });

export const MarketingConsent =
  (models.MarketingConsent as Model<IMarketingConsent>) ||
  model<IMarketingConsent>("MarketingConsent", schema);
