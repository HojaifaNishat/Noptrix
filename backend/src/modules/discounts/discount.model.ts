import { model, models, Schema, Types } from "mongoose";
import type {
  DiscountStatus,
  DiscountTargetType,
  DiscountType,
} from "./discount.types";

export interface DiscountDocument {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number | null;
  targetType: DiscountTargetType;
  productIds: Types.ObjectId[];
  categoryIds: Types.ObjectId[];
  startsAt: Date;
  endsAt?: Date | null;
  usageLimit?: number | null;
  usageCount: number;
  priority: number;
  status: DiscountStatus;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<DiscountDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    maximumDiscountAmount: { type: Number, default: null, min: 0 },
    targetType: {
      type: String,
      enum: ["ALL", "PRODUCTS", "CATEGORIES"],
      default: "ALL",
    },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    priority: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, versionKey: false },
);

discountSchema.pre("validate", function () {
  if (this.type === "PERCENTAGE" && this.value > 100) {
    this.invalidate("value", "Percentage discount cannot exceed 100");
  }

  if (this.endsAt && this.endsAt <= this.startsAt) {
    this.invalidate("endsAt", "End date must be after start date");
  }

  if (this.targetType === "PRODUCTS" && this.productIds.length === 0) {
    this.invalidate("productIds", "Select at least one product");
  }

  if (this.targetType === "CATEGORIES" && this.categoryIds.length === 0) {
    this.invalidate("categoryIds", "Select at least one category");
  }
});

discountSchema.index({ status: 1, startsAt: 1, endsAt: 1, priority: -1 });
discountSchema.index({ name: 1 });

const DiscountModel =
  models.Discount || model<DiscountDocument>("Discount", discountSchema);

export default DiscountModel;
