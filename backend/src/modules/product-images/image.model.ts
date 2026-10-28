import {
  Schema,
  Types,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface ProductImage {
  productId: Types.ObjectId;
  url: string;
  publicId?: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductImageDocument = HydratedDocument<ProductImage>;

const productImageSchema = new Schema<ProductImage>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
    width: {
      type: Number,
      min: 1,
    },
    height: {
      type: Number,
      min: 1,
    },
    format: {
      type: String,
      trim: true,
    },
    bytes: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

productImageSchema.index({
  productId: 1,
  sortOrder: 1,
  createdAt: 1,
});

productImageSchema.index({
  productId: 1,
  isPrimary: 1,
});

productImageSchema.index(
  { productId: 1 },
  {
    unique: true,
    partialFilterExpression: { isPrimary: true },
    name: "uniq_primary_image_per_product",
  },
);

const ProductImageModel =
  (models.ProductImage as Model<ProductImage> | undefined) ??
  model<ProductImage>("ProductImage", productImageSchema);

export default ProductImageModel;
