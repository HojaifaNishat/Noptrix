import type { Types } from "mongoose";
import type {
  OrderStatus,
  OrderPaymentStatus,
} from "../orders/order.types";

export interface SellerOrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  search?: string;
  sort?: "newest" | "oldest";
}

export interface SellerOrderItem {
  _id?: Types.ObjectId;
  sellerId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  productName: string;
  variantName?: string;
  sku?: string;
  quantity: number;
  fulfilledQuantity: number;
  returnedQuantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  currency: string;
}