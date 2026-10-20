import type { Types } from "mongoose";

export const WISHLIST_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;

export type WishlistStatus =
  (typeof WISHLIST_STATUSES)[number];

export interface WishlistItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  addedAt: Date;
}

export interface Wishlist {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  items: WishlistItem[];
  status: WishlistStatus;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateWishlistInput {
  name?: string;
  description?: string;
}

export interface UpdateWishlistInput {
  name?: string;
  description?: string;
}

export interface AddWishlistItemInput {
  productId: string;
  variantId?: string;
}

export interface WishlistFilters {
  status?: WishlistStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WishlistListResult {
  items: Wishlist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
