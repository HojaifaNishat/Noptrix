import mongoose, { Document, Model, Schema, Types, model } from "mongoose";

export const ORDER_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus =
  typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

export const ORDER_PAYMENT_STATUSES = {
  UNPAID: "UNPAID",
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderPaymentStatus =
  typeof ORDER_PAYMENT_STATUSES[keyof typeof ORDER_PAYMENT_STATUSES];

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IOrderAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode?: string;
  countryCode: string;
  deliveryInstructions?: string;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  customerId: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IOrderAddressSnapshot;
  currency: string;
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: "cod" | "online";
  paymentId?: Types.ObjectId;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  customerNote?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
      immutable: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
      immutable: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
      immutable: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0.01,
      immutable: true,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0.01,
      immutable: true,
    },
  },
  { _id: false, strict: "throw" },
);

const orderAddressSchema = new Schema<IOrderAddressSnapshot>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 240,
      default: undefined,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 24,
      default: undefined,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{2}$/,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
  },
  { _id: false, strict: "throw" },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      uppercase: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) =>
          Array.isArray(items) && items.length > 0 && items.length <= 100,
        message: "An order must contain between 1 and 100 line items.",
      },
    },
    shippingAddress: {
      type: orderAddressSchema,
      required: true,
      immutable: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
      immutable: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0.01,
      immutable: true,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
      default: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0.01,
      immutable: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
      immutable: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: undefined,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(ORDER_PAYMENT_STATUSES),
      required: true,
      default: ORDER_PAYMENT_STATUSES.UNPAID,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      required: true,
      default: ORDER_STATUSES.PENDING,
      index: true,
    },
    customerNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
    cancelledAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

orderSchema.index(
  { orderNumber: 1 },
  { unique: true, name: "uniq_order_number" },
);
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order: Model<IOrderDocument> =
  (mongoose.models.Order as Model<IOrderDocument> | undefined) ??
  model<IOrderDocument>("Order", orderSchema);
