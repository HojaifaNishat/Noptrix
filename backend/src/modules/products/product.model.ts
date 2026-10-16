import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export const PRODUCT_STATUSES = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type ProductStatus =
  (typeof PRODUCT_STATUSES)[keyof typeof PRODUCT_STATUSES];

export const PRODUCT_TYPES = {
  SIMPLE: "SIMPLE",
  VARIABLE: "VARIABLE",
  DIGITAL: "DIGITAL",
  SERVICE: "SERVICE",
} as const;

export type ProductType = (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES];

export const INVENTORY_POLICIES = {
  TRACK: "TRACK",
  DONT_TRACK: "DONT_TRACK",
} as const;

export type InventoryPolicy =
  (typeof INVENTORY_POLICIES)[keyof typeof INVENTORY_POLICIES];

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  type: ProductType;
  shortDescription?: string;
  description: string;
  categoryId?: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
  brandId?: Types.ObjectId;
  collectionIds: Types.ObjectId[];
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  status: ProductStatus;
  isFeatured: boolean;
  sku: string;
  barcode?: string;
  inventoryPolicy: InventoryPolicy;
  hasVariants: boolean;
  defaultImageId?: Types.ObjectId;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  shipping: {
    requiresShipping: boolean;
    weight?: number;
    weightUnit?: "g" | "kg";
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: "cm" | "m";
  };
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 180 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  type: { type: String, enum: Object.values(PRODUCT_TYPES), default: PRODUCT_TYPES.SIMPLE, required: true },
  shortDescription: { type: String, trim: true, maxlength: 500 },
  description: { type: String, trim: true, maxlength: 10000, default: "" },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: undefined },
  subcategoryId: { type: Schema.Types.ObjectId, ref: "Subcategory", default: undefined },
  brandId: { type: Schema.Types.ObjectId, ref: "Brand", default: undefined },
  collectionIds: { type: [{ type: Schema.Types.ObjectId, ref: "Collection" }], default: [] },
  price: { type: Number, required: true, min: 0.01 },
  compareAtPrice: { type: Number, min: 0.01, default: undefined },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/, default: "SAR" },
  images: { type: [{ type: String, trim: true, maxlength: 2048 }], default: [] },
  status: { type: String, enum: Object.values(PRODUCT_STATUSES), default: PRODUCT_STATUSES.DRAFT, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 80 },
  barcode: { type: String, trim: true, maxlength: 120, default: undefined },
  inventoryPolicy: { type: String, enum: Object.values(INVENTORY_POLICIES), default: INVENTORY_POLICIES.TRACK },
  hasVariants: { type: Boolean, default: false },
  defaultImageId: { type: Schema.Types.ObjectId, ref: "ProductImage", default: undefined },
  seo: {
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500 },
    keywords: { type: [{ type: String, trim: true, maxlength: 80 }], default: undefined },
  },
  shipping: {
    requiresShipping: { type: Boolean, default: true },
    weight: { type: Number, min: 0 },
    weightUnit: { type: String, enum: ["g", "kg"] },
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    dimensionUnit: { type: String, enum: ["cm", "m"] },
  },
  createdBy: { type: Schema.Types.ObjectId, default: undefined },
  updatedBy: { type: Schema.Types.ObjectId, default: undefined },
}, {
  timestamps: true,
  versionKey: false,
  strict: "throw",
  minimize: false,
});

productSchema.pre("validate", function () {
  if (this.compareAtPrice !== undefined && this.compareAtPrice < this.price) {
    this.invalidate("compareAtPrice", "compareAtPrice must be greater than or equal to price.");
  }
  if (this.hasVariants && this.type !== PRODUCT_TYPES.VARIABLE) {
    this.invalidate("type", "Products with variants must use VARIABLE type.");
  }
  if (this.type === PRODUCT_TYPES.VARIABLE && !this.hasVariants) {
    this.invalidate("hasVariants", "VARIABLE products must enable hasVariants.");
  }
});

productSchema.index({ slug: 1 }, { unique: true, name: "uniq_product_slug" });
productSchema.index({ sku: 1 }, { unique: true, name: "uniq_product_sku" });
productSchema.index({ barcode: 1 }, { unique: true, sparse: true, name: "uniq_product_barcode" });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ name: "text", description: "text", sku: "text" });

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct> | undefined) ??
  model<IProduct>("Product", productSchema);
