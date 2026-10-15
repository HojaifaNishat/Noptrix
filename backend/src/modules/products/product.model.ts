import mongoose, { Document, Model, Schema, Types, model } from "mongoose";

export const PRODUCT_STATUSES = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type ProductStatus =
  typeof PRODUCT_STATUSES[keyof typeof PRODUCT_STATUSES];

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId?: Types.ObjectId;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: undefined,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    compareAtPrice: {
      type: Number,
      min: 0.01,
      default: undefined,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },
    images: {
      type: [{ type: String, trim: true, maxlength: 2048 }],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUSES),
      default: PRODUCT_STATUSES.DRAFT,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

productSchema.index(
  { slug: 1 },
  { unique: true, name: "uniq_product_slug" },
);
productSchema.index(
  { sku: 1 },
  { unique: true, name: "uniq_product_sku" },
);
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ name: "text", description: "text", sku: "text" });

export const Product: Model<IProductDocument> =
  (mongoose.models.Product as Model<IProductDocument> | undefined) ??
  model<IProductDocument>("Product", productSchema);
