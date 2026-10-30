import { Schema, model, models } from "mongoose";

const broadcastCampaignSchema = new Schema(
  {
    broadcastId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    audience: {
      type: String,
      enum: ["ALL_ACTIVE_CUSTOMERS", "SELECTED_CUSTOMERS"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
    },
    recipientCount: {
      type: Number,
      required: true,
      default: 0,
    },
    queuedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    failedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

broadcastCampaignSchema.index({ createdAt: -1 });

export const BroadcastCampaign =
  models.BroadcastCampaign ??
  model("BroadcastCampaign", broadcastCampaignSchema);
