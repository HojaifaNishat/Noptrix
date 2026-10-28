import { Types } from "mongoose";
import DiscountModel from "./discount.model";
import type {
  CreateDiscountInput,
  DiscountListQuery,
  UpdateDiscountInput,
} from "./discount.types";
import { ApiError } from "../../utils/ApiError";

function validateBusinessRules(input: Partial<CreateDiscountInput>) {
  if (
    input.type === "PERCENTAGE" &&
    input.value !== undefined &&
    input.value > 100
  ) {
    throw ApiError.badRequest("Percentage discount cannot exceed 100");
  }

  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    throw ApiError.badRequest("End date must be after start date");
  }

  if (input.targetType === "PRODUCTS" && !input.productIds?.length) {
    throw ApiError.badRequest("Select at least one product");
  }

  if (input.targetType === "CATEGORIES" && !input.categoryIds?.length) {
    throw ApiError.badRequest("Select at least one category");
  }
}

export async function createDiscount(
  input: CreateDiscountInput,
  actorId?: string,
) {
  validateBusinessRules(input);

  return DiscountModel.create({
    ...input,
    productIds: input.productIds?.map((id) => new Types.ObjectId(id)) ?? [],
    categoryIds: input.categoryIds?.map((id) => new Types.ObjectId(id)) ?? [],
    createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
    updatedBy: actorId ? new Types.ObjectId(actorId) : undefined,
  });
}

export async function getDiscountById(discountId: string) {
  if (!Types.ObjectId.isValid(discountId)) {
    throw ApiError.badRequest("Invalid discount ID");
  }

  const discount = await DiscountModel.findById(discountId);

  if (!discount) throw ApiError.notFound("Discount not found");

  return discount;
}

export async function listDiscounts(query: DiscountListQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    DiscountModel.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    DiscountModel.countDocuments(filter),
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
}

export async function updateDiscount(
  discountId: string,
  input: UpdateDiscountInput,
  actorId?: string,
) {
  const current = await getDiscountById(discountId);
  const merged = {
    type: input.type ?? current.type,
    value: input.value ?? current.value,
    startsAt: input.startsAt ?? current.startsAt,
    endsAt: input.endsAt === undefined ? current.endsAt : input.endsAt,
    targetType: input.targetType ?? current.targetType,
    productIds: input.productIds ?? current.productIds.map(String),
    categoryIds: input.categoryIds ?? current.categoryIds.map(String),
  };

  validateBusinessRules(merged);

  const update: Record<string, unknown> = { ...input };

  if (input.productIds) {
    update.productIds = input.productIds.map((id) => new Types.ObjectId(id));
  }

  if (input.categoryIds) {
    update.categoryIds = input.categoryIds.map((id) => new Types.ObjectId(id));
  }

  if (actorId) update.updatedBy = new Types.ObjectId(actorId);

  Object.assign(current, update);
  await current.save();

  return current;
}

export async function deleteDiscount(discountId: string) {
  const discount = await getDiscountById(discountId);
  await discount.deleteOne();
  return { id: discountId, deleted: true };
}

/**
 * Preview calculation only. Checkout must recalculate from trusted server-side
 * cart/product prices and must not trust a client-submitted subtotal.
 */
export function calculateDiscountAmount(
  type: "PERCENTAGE" | "FIXED",
  value: number,
  subtotal: number,
  maximumDiscountAmount?: number | null,
) {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw ApiError.badRequest("Invalid subtotal");
  }

  let amount = type === "PERCENTAGE" ? (subtotal * value) / 100 : value;

  if (maximumDiscountAmount != null) {
    amount = Math.min(amount, maximumDiscountAmount);
  }

  return Math.min(Math.max(0, Math.round(amount * 100) / 100), subtotal);
}

export async function listPublicDiscounts() {
  const now = new Date();

  return DiscountModel.find({
    status: "ACTIVE",
    startsAt: { $lte: now },
    $and: [
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
      {
        $or: [
          { usageLimit: null },
          { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
        ],
      },
    ],
  }).sort({ priority: -1, createdAt: -1 });
}
