import { model, models, Schema, Types } from "mongoose";
import type { FlashSaleStatus } from "./flash-sale.types";

const flashSaleProductSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    salePrice: { type: Number, required: true, min: 0 },
    quantityLimit: { type: Number, default: null, min: 1 },
    soldQuantity: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

export interface FlashSaleDocument {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  products: Array<{
    productId: Types.ObjectId;
    salePrice: number;
    quantityLimit?: number | null;
    soldQuantity: number;
  }>;
  status: FlashSaleStatus;
  priority: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const flashSaleSchema = new Schema<FlashSaleDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    products: {
      type: [flashSaleProductSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "A flash sale must contain at least one product",
      },
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE"],
      default: "DRAFT",
    },
    priority: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, versionKey: false },
);

flashSaleSchema.pre("validate", function () {
  if (this.endsAt <= this.startsAt) {
    this.invalidate("endsAt", "End date must be after start date");
  }

  const ids = this.products.map((item) => String(item.productId));
  if (new Set(ids).size !== ids.length) {
    this.invalidate("products", "Duplicate products are not allowed");
  }
});

flashSaleSchema.index({ status: 1, startsAt: 1, endsAt: 1, priority: -1 });
flashSaleSchema.index({ "products.productId": 1 });

const FlashSaleModel =
  models.FlashSale || model<FlashSaleDocument>("FlashSale", flashSaleSchema);

export default FlashSaleModel;
