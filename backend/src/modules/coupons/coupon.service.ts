import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import CouponModel, { type CouponDiscountType } from "./coupon.model";
import type {
  CouponListQuery,
  CreateCouponInput,
  UpdateCouponInput,
} from "./coupon.types";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeCode = (code: string) => code.trim().toUpperCase();

const calculateDiscount = (
  type: CouponDiscountType,
  value: number,
  subtotal: number,
  maximumDiscountAmount?: number,
) => {
  let discount = type === "PERCENTAGE" ? (subtotal * value) / 100 : value;

  if (maximumDiscountAmount !== undefined) {
    discount = Math.min(discount, maximumDiscountAmount);
  }

  return roundMoney(Math.min(subtotal, Math.max(0, discount)));
};

export const createCoupon = async (
  input: CreateCouponInput,
  actorId?: string,
) => {
  const code = normalizeCode(input.code);

  const existing = await CouponModel.exists({ code });
  if (existing) {
    throw ApiError.conflict("A coupon with this code already exists.");
  }

  const payload = {
    ...input,
    code,
    ...(actorId && Types.ObjectId.isValid(actorId)
      ? { createdBy: new Types.ObjectId(actorId) }
      : {}),
  };

  try {
    return await CouponModel.create(payload);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw ApiError.conflict("A coupon with this code already exists.");
    }
    throw error;
  }
};

export const getCouponById = async (couponId: string) => {
  if (!Types.ObjectId.isValid(couponId)) {
    throw ApiError.badRequest("Invalid coupon ID.");
  }

  const coupon = await CouponModel.findById(couponId);
  if (!coupon) throw ApiError.notFound("Coupon not found.");

  return coupon;
};

export const listCoupons = async (
  filters: {
    page?: CouponListQuery["page"];
    limit?: CouponListQuery["limit"];
    status?: CouponListQuery["status"];
    search?: CouponListQuery["search"];
  } = {},
) => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const query: Record<string, unknown> = {};

  if (filters.status) query.status = filters.status;

  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { code: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    CouponModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CouponModel.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateCoupon = async (
  couponId: string,
  input: UpdateCouponInput,
  actorId?: string,
) => {
  const coupon = await getCouponById(couponId);

  const nextType = input.discountType ?? coupon.discountType;
  const nextValue = input.discountValue ?? coupon.discountValue;
  const nextStart = input.startsAt ?? coupon.startsAt;
  const nextExpiry = input.expiresAt ?? coupon.expiresAt;

  if (nextType === "PERCENTAGE" && nextValue > 100) {
    throw ApiError.badRequest("Percentage discount cannot exceed 100.");
  }

  if (nextExpiry <= nextStart) {
    throw ApiError.badRequest("Expiry must be later than the start date.");
  }

  if (
    input.usageLimit !== undefined &&
    input.usageLimit !== null &&
    input.usageLimit < coupon.usageCount
  ) {
    throw ApiError.badRequest(
      "Usage limit cannot be lower than the number of redemptions.",
    );
  }

  Object.assign(coupon, input);

  if (actorId && Types.ObjectId.isValid(actorId)) {
    coupon.updatedBy = new Types.ObjectId(actorId);
  }

  await coupon.save();
  return coupon;
};

export const deleteCoupon = async (couponId: string) => {
  const coupon = await getCouponById(couponId);

  if (coupon.usageCount > 0) {
    throw ApiError.conflict(
      "A redeemed coupon cannot be deleted. Deactivate it instead.",
    );
  }

  await coupon.deleteOne();
  return { id: couponId };
};

export const validateCoupon = async (
  codeInput: string,
  subtotalInput: number,
) => {
  const code = normalizeCode(codeInput);
  const subtotal = roundMoney(Number(subtotalInput));

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw ApiError.badRequest("Invalid order subtotal.");
  }

  const coupon = await CouponModel.findOne({ code });

  if (!coupon || coupon.status !== "ACTIVE") {
    throw ApiError.badRequest("This coupon is invalid or inactive.");
  }

  const now = new Date();

  if (now < coupon.startsAt) {
    throw ApiError.badRequest("This coupon is not available yet.");
  }

  if (now >= coupon.expiresAt) {
    throw ApiError.badRequest("This coupon has expired.");
  }

  if (
    coupon.usageLimit !== undefined &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    throw ApiError.badRequest("This coupon has reached its usage limit.");
  }

  if (subtotal < coupon.minimumOrderAmount) {
    throw ApiError.badRequest(
      `Minimum order amount for this coupon is ${coupon.minimumOrderAmount}.`,
    );
  }

  const discountAmount = calculateDiscount(
    coupon.discountType,
    coupon.discountValue,
    subtotal,
    coupon.maximumDiscountAmount,
  );

  return {
    couponId: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    subtotal,
    discountAmount,
    totalAfterDiscount: roundMoney(subtotal - discountAmount),
    currency: undefined,
  };
};
