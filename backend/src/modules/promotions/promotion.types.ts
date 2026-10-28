import type { Types } from "mongoose";

export const PROMOTION_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "EXPIRED",
  "ARCHIVED",
] as const;

export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export const PROMOTION_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"] as const;

export type PromotionType = (typeof PROMOTION_TYPES)[number];

export interface IPromotion {
  title: string;
  slug: string;
  description?: string;
  type: PromotionType;
  value: number;
  currency: string;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  startsAt: Date;
  endsAt: Date;
  status: PromotionStatus;
  applicableProductIds: Types.ObjectId[];
  applicableCategoryIds: Types.ObjectId[];
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  isStackable: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromotionInput {
  title: string;
  slug: string;
  description?: string;
  type: PromotionType;
  value: number;
  currency?: string;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  startsAt: string;
  endsAt: string;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  usageLimit?: number;
  perUserLimit?: number;
  isStackable?: boolean;
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>;

export interface PromotionQuery {
  status?: PromotionStatus;
  type?: PromotionType;
  search?: string;
  page?: number;
  limit?: number;
}
