import { Types } from "mongoose";

export type ReceiptStatus = "ISSUED" | "VOID";

export interface ReceiptLineItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptSnapshot {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  items: ReceiptLineItem[];
}

export interface ReceiptDocument {
  receiptNumber: string;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  paymentId?: Types.ObjectId | null;
  status: ReceiptStatus;
  snapshot: ReceiptSnapshot;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptListQuery {
  page?: number;
  limit?: number;
  status?: ReceiptStatus;
}
