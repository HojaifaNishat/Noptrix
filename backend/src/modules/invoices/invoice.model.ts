import { model, models, Schema, Types } from "mongoose";
import type { InvoiceStatus } from "./invoice.types";

const invoiceLineSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 500 },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    sku: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceTotalsSchema = new Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    shippingAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export interface InvoiceDocument {
  _id: Types.ObjectId;
  invoiceNumber: string;
  orderId?: Types.ObjectId;
  customerId: Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  currency: string;
  lines: Array<{
    description: string;
    productId?: Types.ObjectId;
    sku?: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
  }>;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingAmount: number;
    total: number;
  };
  status: InvoiceStatus;
  issuedAt?: Date | null;
  dueAt?: Date | null;
  paidAt?: Date | null;
  voidedAt?: Date | null;
  billingAddress?: Record<string, unknown>;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      immutable: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },
    customerName: { type: String, required: true, trim: true, maxlength: 200 },
    customerEmail: { type: String, trim: true, lowercase: true },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      immutable: true,
    },
    lines: {
      type: [invoiceLineSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "Invoice must contain at least one line",
      },
    },
    totals: { type: invoiceTotalsSchema, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "PAID", "VOID", "OVERDUE"],
      default: "DRAFT",
      index: true,
    },
    issuedAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    voidedAt: { type: Date, default: null },
    billingAddress: { type: Schema.Types.Mixed },
    notes: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, versionKey: false },
);

invoiceSchema.index({ customerId: 1, createdAt: -1 });
invoiceSchema.index({ orderId: 1 }, { sparse: true });
invoiceSchema.index({ status: 1, dueAt: 1 });

const InvoiceModel =
  models.Invoice || model<InvoiceDocument>("Invoice", invoiceSchema);

export default InvoiceModel;
