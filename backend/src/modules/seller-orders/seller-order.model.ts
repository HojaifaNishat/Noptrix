import {
  Schema,
  Types,
} from "mongoose";

/**
 * Seller Order Item Snapshot
 *
 * Seller ownership and item details are snapshotted
 * at checkout/order creation time.
 */
export interface SellerOrderItemSnapshot {
  _id?: Types.ObjectId;

  sellerId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;

  sku?: string;
  productName: string;
  variantName?: string;

  quantity: number;
  fulfilledQuantity: number;
  returnedQuantity: number;

  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;

  currency: string;
}

/**
 * Embedded schema for an order's seller-owned item.
 *
 * This is NOT a standalone Mongoose model.
 * It must be integrated into the existing OrderModel.
 */
export const sellerOrderItemSnapshotSchema =
  new Schema<SellerOrderItemSnapshot>(
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
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 180,
      },

      variantName: {
        type: String,
        trim: true,
        maxlength: 180,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
          validator: Number.isInteger,
          message: "Quantity must be an integer.",
        },
      },

      fulfilledQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: {
          validator: Number.isInteger,
          message: "Fulfilled quantity must be an integer.",
        },
      },

      returnedQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: {
          validator: Number.isInteger,
          message: "Returned quantity must be an integer.",
        },
      },

      unitPrice: {
        type: Number,
        required: true,
        min: 0,
      },

      discountAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      taxAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      lineTotal: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        required: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3,
        match: /^[A-Z]{3}$/,
      },
    },
    {
      _id: true,
      strict: "throw",
    },
  );

/**
 * Quantity consistency validation
 */
sellerOrderItemSnapshotSchema.pre(
  "validate",
  function () {
    if (this.fulfilledQuantity > this.quantity) {
      this.invalidate(
        "fulfilledQuantity",
        "Fulfilled quantity cannot exceed ordered quantity.",
      );
    }

    if (this.returnedQuantity > this.fulfilledQuantity) {
      this.invalidate(
        "returnedQuantity",
        "Returned quantity cannot exceed fulfilled quantity.",
      );
    }

    const expectedLineTotal =
      this.unitPrice * this.quantity -
      this.discountAmount +
      this.taxAmount;

    if (
      this.discountAmount > this.unitPrice * this.quantity
    ) {
      this.invalidate(
        "discountAmount",
        "Discount cannot exceed the item subtotal.",
      );
    }

    if (
      Number.isFinite(expectedLineTotal) &&
      Math.abs(this.lineTotal - expectedLineTotal) > 0.01
    ) {
      this.invalidate(
        "lineTotal",
        "Line total does not match price, discount, and tax.",
      );
    }
  },
);