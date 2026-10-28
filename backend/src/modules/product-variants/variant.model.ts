import {
  Schema,
  Types,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

import { VARIANT_STATUSES, type VariantStatus } from "./variant.types";

export interface ProductVariant {
  productId: Types.ObjectId;
  title: string;
  sku?: string;
  barcode?: string;
  options: Map<string, string>;
  optionsKey: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  status: VariantStatus;
  sortOrder: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductVariantDocument = HydratedDocument<ProductVariant>;

const productVariantSchema = new Schema<ProductVariant>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    options: {
      type: Map,
      of: String,
      default: {},
    },
    optionsKey: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5,
    },
    status: {
      type: String,
      enum: VARIANT_STATUSES,
      default: "ACTIVE",
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        if (ret.options instanceof Map) {
          (ret as unknown as Record<string, unknown>).options =
            Object.fromEntries(ret.options);
        }
        return ret;
      },
    },
  },
);

productVariantSchema.index(
  { productId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: { sku: { $type: "string" } },
  },
);

productVariantSchema.index(
  { productId: 1, barcode: 1 },
  {
    unique: true,
    partialFilterExpression: { barcode: { $type: "string" } },
  },
);

productVariantSchema.index(
  { productId: 1, optionsKey: 1 },
  {
    unique: true,
    partialFilterExpression: { optionsKey: { $type: "string" } },
  },
);

productVariantSchema.index({ productId: 1, sortOrder: 1, createdAt: -1 });

const ProductVariantModel =
  (models.ProductVariant as Model<ProductVariant> | undefined) ??
  model<ProductVariant>("ProductVariant", productVariantSchema);

export default ProductVariantModel;
