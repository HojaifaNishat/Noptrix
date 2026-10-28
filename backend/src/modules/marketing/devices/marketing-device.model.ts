import { Schema, model, models, type Model, Types } from "mongoose";

export interface IMarketingDevice {
  userId: Types.ObjectId;
  token: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMarketingDevice>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    token: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false, collection: "marketing_devices" },
);

schema.index({ token: 1 }, { unique: true });
schema.index({ userId: 1, active: 1 });

export const MarketingDevice =
  (models.MarketingDevice as Model<IMarketingDevice>) ||
  model<IMarketingDevice>("MarketingDevice", schema);
