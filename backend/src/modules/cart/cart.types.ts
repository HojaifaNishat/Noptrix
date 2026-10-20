import type { Types } from "mongoose";

export const CART_STATUSES = [
  "ACTIVE",
  "CONVERTED",
  "ABANDONED",
] as const;

export type CartStatus = (typeof CART_STATUSES)[number];

export interface CartItem {
  _id?: Types.ObjectId;

  productId: Types.ObjectId;
  variantId?: Types.ObjectId;

  sku?: string;
  productName: string;
  variantName?: string;
  imageUrl?: string;

  quantity: number;

  unitPrice: number;
  compareAtPrice?: number;

  currency: string;

  addedAt?: Date;
  updatedAt?: Date;
}

export interface Cart {
  _id?: Types.ObjectId;

  userId: Types.ObjectId;

  items: CartItem[];

  status: CartStatus;

  currency: string;

  itemCount: number;
  subtotal: number;

  appliedCouponCode?: string;

  expiresAt?: Date;
  convertedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddCartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CartFilters {
  status?: CartStatus;
}

export interface CartPriceSummary {
  currency: string;
  itemCount: number;
  subtotal: number;
}

export interface CartResponse {
  cart: Cart;
  summary: CartPriceSummary;
}
