import type { Types } from "mongoose";
import type { TransactionType } from "./transaction.model";

export interface TransactionListQuery {
  page: number;
  limit: number;
  type?: TransactionType;
  status?: string;
  orderId?: string;
  paymentId?: string;
  provider?: string;
  from?: Date;
  to?: Date;
}

export interface TransactionHistoryItem {
  _id: Types.ObjectId;
  paymentId: Types.ObjectId;
  transactionId: string;
  orderId: string;
  type: TransactionType;
  previousStatus?: string;
  status: string;
  amount: number;
  currency: string;
  provider?: string;
  createdAt: Date;
}
