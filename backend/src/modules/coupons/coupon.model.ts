import { Schema, model, models, type Types } from "mongoose";

export const COUPON_DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

export const COUPON_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];

export interface Coupon {
  _id?: Types.ObjectId;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  startsAt: Date;
  expiresAt: Date;
  status: CouponStatus;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const couponSchema = new Schema<Coupon>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    discountType: {
      type: String,
      enum: COUPON_DISCOUNT_TYPES,
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0.01,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumDiscountAmount: {
      type: Number,
      min: 0.01,
    },
    usageLimit: {
      type: Number,
      min: 1,
      validate: Number.isInteger,
    },
    usageLimitPerUser: {
      type: Number,
      min: 1,
      validate: Number.isInteger,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isInteger,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: COUPON_STATUSES,
      default: "ACTIVE",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  },
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ status: 1, startsAt: 1, expiresAt: 1 });

couponSchema.pre("validate", function () {
  if (this.discountType === "PERCENTAGE" && this.discountValue > 100) {
    this.invalidate("discountValue", "Percentage discount cannot exceed 100.");
  }

  if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) {
    this.invalidate("expiresAt", "Expiry must be later than the start date.");
  }
});

const CouponModel = models.Coupon || model<Coupon>("Coupon", couponSchema);

export default CouponModel;
