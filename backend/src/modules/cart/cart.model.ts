import mongoose, {
  model,
  Schema,
  type Model,
} from "mongoose";

import {
  CART_STATUSES,
  type Cart,
} from "./cart.types";

const cartItemSchema = new Schema(
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

    sku: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    productName: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },

    variantName: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },

    addedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    _id: true,
    strict: "throw",
  },
);

const cartSchema = new Schema<Cart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    status: {
      type: String,
      enum: CART_STATUSES,
      default: "ACTIVE",
      required: true,
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      default: "BDT",
      required: true,
    },

    itemCount: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },

    subtotal: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },

    appliedCouponCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },

    expiresAt: {
      type: Date,
    },

    convertedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
    collection: "carts",
  },
);

cartSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "ACTIVE",
    },
    name: "one_active_cart_per_user",
  },
);

cartSchema.index({ status: 1, updatedAt: -1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.pre("validate", function () {
  const itemKeys = new Set<string>();
  let itemCount = 0;
  let subtotal = 0;

  for (const item of this.items) {
    const key = `${String(item.productId)}:${String(item.variantId ?? "")}`;

    if (itemKeys.has(key)) {
      this.invalidate(
        "items",
        "A product and variant can appear only once in the cart",
      );
    }

    itemKeys.add(key);

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      this.invalidate("items", "Cart quantity must be a positive integer");
    }

    itemCount += item.quantity;
    subtotal += item.quantity * item.unitPrice;
  }

  this.itemCount = itemCount;
  this.subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;
});

export type CartDocument = mongoose.HydratedDocument<Cart>;

export const CartModel: Model<Cart> =
  (mongoose.models.Cart as Model<Cart> | undefined) ??
  model<Cart>("Cart", cartSchema);

export default CartModel;
