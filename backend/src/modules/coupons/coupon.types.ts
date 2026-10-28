import type { Types } from "mongoose";

export type CouponDiscountType = "PERCENTAGE" | "FIXED";

export type CouponStatus = "ACTIVE" | "INACTIVE";

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  status?: CouponStatus;
}

export interface UpdateCouponInput {
  code?: string;
  description?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  status?: CouponStatus;
}

export interface ValidateCouponInput {
  code: string;
  subtotal: number;
}

export interface CouponDiscountResult {
  couponId: Types.ObjectId | string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  totalAfterDiscount: number;
  currency?: string;
}

export interface CouponListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CouponStatus;
  discountType?: CouponDiscountType;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
