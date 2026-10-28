import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

import {
  SHIPPING_STATUSES,
  type IShipping,
  type IShippingAddress,
  type ITrackingEvent,
} from "./shipping.types";

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false },
);

const trackingEventSchema = new Schema<ITrackingEvent>(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    status: {
      type: String,
      enum: SHIPPING_STATUSES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    occurredAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const shippingSchema = new Schema<IShipping>(
  {
    shipmentNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    riderId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "internal",
      maxlength: 80,
    },
    providerShipmentId: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    status: {
      type: String,
      enum: SHIPPING_STATUSES,
      required: true,
      default: "created",
      index: true,
    },
    address: {
      type: shippingAddressSchema,
      required: true,
    },
    shippingFee: {
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
      default: "SAR",
    },
    estimatedDeliveryAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    failureReason: {
      type: String,
      maxlength: 500,
    },
    trackingEvents: {
      type: [trackingEventSchema],
      default: [],
    },
    idempotencyKey: {
      type: String,
      maxlength: 200,
    },
    createdBy: Schema.Types.ObjectId,
  },
  {
    timestamps: true,
    versionKey: "__v",
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

shippingSchema.index({ orderId: 1, createdAt: -1 });
shippingSchema.index({ customerId: 1, createdAt: -1 });
shippingSchema.index({ status: 1, updatedAt: -1 });

shippingSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" },
    },
  },
);

shippingSchema.index(
  { provider: 1, providerShipmentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerShipmentId: { $type: "string" },
    },
  },
);

export type ShippingDocument = HydratedDocument<IShipping>;

export const Shipping: Model<IShipping> =
  (models.Shipping as Model<IShipping>) ||
  model<IShipping>("Shipping", shippingSchema);
