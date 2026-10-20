import mongoose, {
  model,
  Schema,
  type Model,
} from "mongoose";

import {
  PURCHASE_RETURN_REFUND_METHODS,
  PURCHASE_RETURN_REFUND_STATUSES,
  PURCHASE_RETURN_REASONS,
  PURCHASE_RETURN_STATUSES,
} from "./purchaseReturn.types";

import type {
  PurchaseReturn,
  PurchaseReturnItem,
  PurchaseReturnRefund,
  PurchaseReturnAuditEntry,
} from "./purchaseReturn.types";

const purchaseReturnItemSchema = new Schema<PurchaseReturnItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      immutable: true,
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
      maxlength: 250,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Return quantity must be a safe integer.",
      },
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: PURCHASE_RETURN_REASONS,
      required: true,
    },
    condition: {
      type: String,
      enum: ["DAMAGED", "DEFECTIVE", "UNOPENED", "OTHER"],
    },
    restock: {
      type: Boolean,
      default: false,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

const purchaseReturnRefundSchema = new Schema<PurchaseReturnRefund>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    method: {
      type: String,
      enum: PURCHASE_RETURN_REFUND_METHODS,
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    refundedAt: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

const purchaseReturnAuditSchema = new Schema<PurchaseReturnAuditEntry>(
  {
    action: {
      type: String,
      enum: [
        "CREATED",
        "UPDATED",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
        "REFUND_RECORDED",
        "CANCELLED",
      ],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
    },
    performedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    _id: false,
    strict: "throw",
  },
);

const purchaseReturnSchema = new Schema<PurchaseReturn>(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      uppercase: true,
      maxlength: 64,
    },
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
      immutable: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      immutable: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      immutable: true,
      index: true,
    },
    items: {
      type: [purchaseReturnItemSchema],
      required: true,
      validate: {
        validator: (items: PurchaseReturnItem[]) =>
          Array.isArray(items) && items.length > 0,
        message: "A purchase return must contain at least one item.",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundedAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: PURCHASE_RETURN_REFUND_STATUSES,
      required: true,
      default: "PENDING",
    },
    refunds: {
      type: [purchaseReturnRefundSchema],
      default: [],
    },
    status: {
      type: String,
      enum: PURCHASE_RETURN_STATUSES,
      required: true,
      default: "REQUESTED",
      index: true,
    },
    reason: {
      type: String,
      enum: PURCHASE_RETURN_REASONS,
      required: true,
    },
    reasonDetails: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    supplierReference: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    referenceNumber: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    approvedAt: Date,
    rejectedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      immutable: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    auditTrail: {
      type: [purchaseReturnAuditSchema],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    strict: "throw",
    optimisticConcurrency: true,
    minimize: false,
  },
);

purchaseReturnSchema.index(
  { returnNumber: 1 },
  { unique: true, name: "purchase_return_number_unique" },
);

purchaseReturnSchema.index(
  { purchaseId: 1, createdAt: -1 },
  { name: "purchase_return_purchase_created" },
);

purchaseReturnSchema.index(
  { supplierId: 1, status: 1, createdAt: -1 },
  { name: "purchase_return_supplier_status_created" },
);

purchaseReturnSchema.index(
  { warehouseId: 1, status: 1, createdAt: -1 },
  { name: "purchase_return_warehouse_status_created" },
);

purchaseReturnSchema.index(
  { refundStatus: 1, status: 1, createdAt: -1 },
  { name: "purchase_return_refund_status_created" },
);

purchaseReturnSchema.index(
  { requestedBy: 1, createdAt: -1 },
  { name: "purchase_return_requester_created" },
);

purchaseReturnSchema.index(
  { status: 1, requestedAt: -1 },
  { name: "purchase_return_status_requested" },
);

purchaseReturnSchema.pre("validate", function () {
  const moneyFields = [
    this.subtotal,
    this.discountAmount,
    this.taxAmount,
    this.totalAmount,
    this.refundedAmount,
  ];

  if (
    moneyFields.some(
      (value) => !Number.isFinite(value) || value < 0,
    )
  ) {
    this.invalidate(
      "totalAmount",
      "Purchase return monetary values must be finite and non-negative.",
    );
  }

  if (this.discountAmount > this.subtotal) {
    this.invalidate(
      "discountAmount",
      "Return discount cannot exceed subtotal.",
    );
  }

  if (this.refundedAmount > this.totalAmount + 0.001) {
    this.invalidate(
      "refundedAmount",
      "Refunded amount cannot exceed the return total.",
    );
  }

  if (
    this.status === "COMPLETED" &&
    !this.completedAt
  ) {
    this.invalidate(
      "completedAt",
      "Completed returns must have a completion timestamp.",
    );
  }

  if (
    this.status === "REJECTED" &&
    !this.rejectionReason?.trim()
  ) {
    this.invalidate(
      "rejectionReason",
      "Rejected returns require a rejection reason.",
    );
  }

  if (
    this.status === "CANCELLED" &&
    !this.cancellationReason?.trim()
  ) {
    this.invalidate(
      "cancellationReason",
      "Cancelled returns require a cancellation reason.",
    );
  }

  const calculatedRefundTotal = this.refunds.reduce(
    (sum, refund) => sum + refund.amount,
    0,
  );

  if (
    Math.abs(calculatedRefundTotal - this.refundedAmount) > 0.01
  ) {
    this.invalidate(
      "refundedAmount",
      "Refunded amount must match the recorded refund entries.",
    );
  }

  if (this.refundedAmount <= 0) {
    if (
      this.refundStatus === "REFUNDED" ||
      this.refundStatus === "PARTIALLY_REFUNDED"
    ) {
      this.invalidate(
        "refundStatus",
        "Refund status does not match the recorded refund amount.",
      );
    }
  } else if (this.refundedAmount + 0.01 >= this.totalAmount) {
    if (this.refundStatus !== "REFUNDED") {
      this.invalidate(
        "refundStatus",
        "Fully refunded returns must use REFUNDED status.",
      );
    }
  } else if (this.refundStatus !== "PARTIALLY_REFUNDED") {
    this.invalidate(
      "refundStatus",
      "Partial refunds must use PARTIALLY_REFUNDED status.",
    );
  }
});

export type PurchaseReturnDocument =
  mongoose.HydratedDocument<PurchaseReturn>;

export const PurchaseReturnModel: Model<PurchaseReturn> =
  (mongoose.models.PurchaseReturn as Model<PurchaseReturn> | undefined) ??
  model<PurchaseReturn>(
    "PurchaseReturn",
    purchaseReturnSchema,
  );

export default PurchaseReturnModel;
