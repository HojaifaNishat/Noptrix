import { Schema, Types, model, models, type Model } from "mongoose";

import { WISHLIST_STATUSES, type Wishlist } from "./wishlist.types";

const wishlistItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    addedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    _id: true,
    versionKey: false,
  },
);

const wishlistSchema = new Schema<Wishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    items: {
      type: [wishlistItemSchema],
      default: [],
      validate: {
        validator(
          items: Array<{
            productId: Types.ObjectId;
            variantId?: Types.ObjectId;
          }>,
        ) {
          if (items.length > 500) return false;

          const keys = items.map(
            (item) =>
              `${String(item.productId)}:${String(item.variantId ?? "")}`,
          );

          return new Set(keys).size === keys.length;
        },
        message: "Wishlist contains duplicate products or variants.",
      },
    },
    status: {
      type: String,
      enum: WISHLIST_STATUSES,
      default: "ACTIVE",
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
    collection: "wishlists",
  },
);

wishlistSchema.index(
  { userId: 1, status: 1, updatedAt: -1 },
  { name: "wishlist_user_status_updated" },
);

wishlistSchema.index({ userId: 1, name: 1 }, { name: "wishlist_user_name" });

wishlistSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDefault: true,
      status: "ACTIVE",
    },
    name: "one_default_active_wishlist_per_user",
  },
);

wishlistSchema.index(
  { "items.productId": 1 },
  { name: "wishlist_product_lookup" },
);

export const WishlistModel: Model<Wishlist> =
  (models.Wishlist as Model<Wishlist> | undefined) ??
  model<Wishlist>("Wishlist", wishlistSchema);

export default WishlistModel;
