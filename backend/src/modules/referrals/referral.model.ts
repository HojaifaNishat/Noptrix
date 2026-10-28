import { Schema, Types, model, models, type Model } from "mongoose";

import type { IReferral, IReferralCode } from "./referral.types";

const referralCodeSchema = new Schema<IReferralCode>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const referralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "QUALIFIED", "REWARDED", "REJECTED"],
      default: "PENDING",
      required: true,
      index: true,
    },
    qualifiedAt: Date,
    rewardedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

referralSchema.index({ referrerId: 1, createdAt: -1 });
referralSchema.index({ referrerId: 1, status: 1, createdAt: -1 });

export const ReferralCodeModel: Model<IReferralCode> =
  (models.ReferralCode as Model<IReferralCode> | undefined) ??
  model<IReferralCode>("ReferralCode", referralCodeSchema);

export const ReferralModel: Model<IReferral> =
  (models.Referral as Model<IReferral> | undefined) ??
  model<IReferral>("Referral", referralSchema);

export { Types };
