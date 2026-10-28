import type { Types } from "mongoose";

export const PURCHASE_RETURN_STATUSES = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type PurchaseReturnStatus = (typeof PURCHASE_RETURN_STATUSES)[number];

export const PURCHASE_RETURN_REFUND_STATUSES = [
  "NOT_APPLICABLE",
  "PENDING",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export type PurchaseReturnRefundStatus =
  (typeof PURCHASE_RETURN_REFUND_STATUSES)[number];

export const PURCHASE_RETURN_REASONS = [
  "DAMAGED",
  "DEFECTIVE",
  "WRONG_ITEM",
  "EXCESS_QUANTITY",
  "EXPIRED",
  "QUALITY_ISSUE",
  "SUPPLIER_ERROR",
  "OTHER",
] as const;

export type PurchaseReturnReason = (typeof PURCHASE_RETURN_REASONS)[number];

export const PURCHASE_RETURN_REFUND_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "CREDIT_NOTE",
  "OTHER",
] as const;

export type PurchaseReturnRefundMethod =
  (typeof PURCHASE_RETURN_REFUND_METHODS)[number];

export interface PurchaseReturnItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  sku?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  reason: PurchaseReturnReason;
  condition?: "DAMAGED" | "DEFECTIVE" | "UNOPENED" | "OTHER";
  restock: boolean;
  note?: string;
}

export interface PurchaseReturnRefund {
  _id?: Types.ObjectId;
  amount: number;
  method: PurchaseReturnRefundMethod;
  referenceNumber?: string;
  refundedAt: Date;
  note?: string;
  recordedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseReturnAuditEntry {
  action:
    | "CREATED"
    | "UPDATED"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED"
    | "REFUND_RECORDED"
    | "CANCELLED";
  performedBy: Types.ObjectId;
  performedAt: Date;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface PurchaseReturn {
  _id?: Types.ObjectId;

  returnNumber: string;
  purchaseId: Types.ObjectId;
  supplierId: Types.ObjectId;
  warehouseId: Types.ObjectId;

  items: PurchaseReturnItem[];

  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;

  refundedAmount: number;
  refundStatus: PurchaseReturnRefundStatus;
  refunds: PurchaseReturnRefund[];

  status: PurchaseReturnStatus;

  reason: PurchaseReturnReason;
  reasonDetails?: string;
  supplierReference?: string;
  referenceNumber?: string;

  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;

  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  completedBy?: Types.ObjectId;
  cancelledBy?: Types.ObjectId;

  rejectionReason?: string;
  cancellationReason?: string;
  notes?: string;

  auditTrail: PurchaseReturnAuditEntry[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePurchaseReturnItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  reason: PurchaseReturnReason;
  condition?: "DAMAGED" | "DEFECTIVE" | "UNOPENED" | "OTHER";
  restock?: boolean;
  note?: string;
}

export interface CreatePurchaseReturnInput {
  purchaseId: string;
  items: CreatePurchaseReturnItemInput[];
  reason: PurchaseReturnReason;
  reasonDetails?: string;
  supplierReference?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface UpdatePurchaseReturnInput {
  items?: CreatePurchaseReturnItemInput[];
  reason?: PurchaseReturnReason;
  reasonDetails?: string;
  supplierReference?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PurchaseReturnFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseReturnStatus;
  refundStatus?: PurchaseReturnRefundStatus;
  purchaseId?: string;
  supplierId?: string;
  warehouseId?: string;
  requestedBy?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "updatedAt" | "returnNumber" | "totalAmount";
  sortOrder?: "asc" | "desc";
}

export interface ApprovePurchaseReturnInput {
  note?: string;
}

export interface RejectPurchaseReturnInput {
  reason: string;
}

export interface CompletePurchaseReturnInput {
  note?: string;
}

export interface RecordPurchaseReturnRefundInput {
  amount: number;
  method: PurchaseReturnRefundMethod;
  referenceNumber?: string;
  refundedAt?: string;
  note?: string;
}

export interface CancelPurchaseReturnInput {
  reason: string;
}
