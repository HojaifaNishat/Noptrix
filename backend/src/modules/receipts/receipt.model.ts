import { Schema, model, models, type Model } from "mongoose";
import type {
  ReceiptDocument,
  ReceiptLineItem,
  ReceiptSnapshot,
  ReceiptStatus,
} from "./receipt.types";

const receiptLineItemSchema = new Schema<ReceiptLineItem>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const receiptSnapshotSchema = new Schema<ReceiptSnapshot>(
  {
    orderNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    currency: { type: String, required: true, uppercase: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    items: { type: [receiptLineItemSchema], default: [] },
  },
  { _id: false },
);

const receiptSchema = new Schema<ReceiptDocument>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["ISSUED", "VOID"] satisfies ReceiptStatus[],
      default: "ISSUED",
      required: true,
      index: true,
    },
    snapshot: {
      type: receiptSnapshotSchema,
      required: true,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

receiptSchema.index({ userId: 1, createdAt: -1 });
receiptSchema.index({ userId: 1, status: 1, createdAt: -1 });

const ReceiptModel =
  (models.Receipt as Model<ReceiptDocument> | undefined) ??
  model<ReceiptDocument>("Receipt", receiptSchema);

export default ReceiptModel;
