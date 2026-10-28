import { Schema, model, models, type Model } from "mongoose";

export const BANNER_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
] as const;

export interface IMarketingBanner {
  title: string;
  imageUrl: string;
  mobileImageUrl?: string;
  altText?: string;
  targetUrl?: string;
  placement: string;
  status: (typeof BANNER_STATUSES)[number];
  sortOrder: number;
  startsAt?: Date;
  endsAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMarketingBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    imageUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    mobileImageUrl: { type: String, trim: true, maxlength: 2048 },
    altText: { type: String, trim: true, maxlength: 250 },
    targetUrl: { type: String, trim: true, maxlength: 2048 },
    placement: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
      index: true,
    },
    status: {
      type: String,
      enum: BANNER_STATUSES,
      default: "DRAFT",
      index: true,
    },
    sortOrder: { type: Number, default: 0, min: 0, max: 100000 },
    startsAt: Date,
    endsAt: Date,
    createdBy: String,
    updatedBy: String,
  },
  { timestamps: true, versionKey: false, collection: "marketing_banners" },
);

schema.index({ placement: 1, status: 1, sortOrder: 1 });

export const MarketingBanner =
  (models.MarketingBanner as Model<IMarketingBanner>) ||
  model<IMarketingBanner>("MarketingBanner", schema);
