export type DiscountType = "PERCENTAGE" | "FIXED";
export type DiscountStatus = "ACTIVE" | "INACTIVE";
export type DiscountTargetType = "ALL" | "PRODUCTS" | "CATEGORIES";

export interface CreateDiscountInput {
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number | null;
  targetType?: DiscountTargetType;
  productIds?: string[];
  categoryIds?: string[];
  startsAt: Date;
  endsAt?: Date | null;
  usageLimit?: number | null;
  priority?: number;
  status?: DiscountStatus;
}

export type UpdateDiscountInput = Partial<CreateDiscountInput>;

export interface DiscountListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: DiscountStatus;
  type?: DiscountType;
}
