import {
  Schema,
  Types,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

export const SELLER_PRODUCT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;

export type SellerProductStatus = (typeof SELLER_PRODUCT_STATUSES)[number];

export interface SellerProduct {
  sellerId: Types.ObjectId;
  productId: Types.ObjectId;

  status: SellerProductStatus;

  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type SellerProductDocument = HydratedDocument<SellerProduct>;

const sellerProductSchema = new Schema<SellerProduct>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: SELLER_PRODUCT_STATUSES,
      required: true,
      default: "PENDING",
      index: true,
    },

    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

sellerProductSchema.index(
  { sellerId: 1, productId: 1 },
  {
    unique: true,
    name: "seller_product_unique",
  },
);

sellerProductSchema.index({
  sellerId: 1,
  status: 1,
  createdAt: -1,
});

sellerProductSchema.index({
  status: 1,
  submittedAt: 1,
});

const SellerProductModel: Model<SellerProduct> =
  (models.SellerProduct as Model<SellerProduct> | undefined) ??
  model<SellerProduct>("SellerProduct", sellerProductSchema);

export default SellerProductModel;
