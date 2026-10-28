import { Schema, model, models } from "mongoose";
import type { IPromotion } from "./promotion.types";
import { PROMOTION_STATUSES, PROMOTION_TYPES } from "./promotion.types";

const promotionSchema = new Schema<IPromotion>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 180,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: PROMOTION_TYPES,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "BDT",
      minlength: 3,
      maxlength: 3,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0.01,
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: PROMOTION_STATUSES,
      default: "DRAFT",
      index: true,
    },
    applicableProductIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    applicableCategoryIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      min: 1,
    },
    isStackable: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

promotionSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
promotionSchema.index({ createdAt: -1 });

promotionSchema.pre("validate", function () {
  if (this.endsAt && this.startsAt && this.endsAt <= this.startsAt) {
    this.invalidate("endsAt", "endsAt must be later than startsAt");
  }

  if (
    this.type === "PERCENTAGE" &&
    this.value !== undefined &&
    this.value > 100
  ) {
    this.invalidate("value", "Percentage cannot exceed 100");
  }
});

const Promotion =
  models.Promotion || model<IPromotion>("Promotion", promotionSchema);

export { Promotion };
export default Promotion;
