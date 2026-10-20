import { Types } from "mongoose";
import Promotion from "./promotion.model";
import type {
  CreatePromotionInput,
  PromotionQuery,
  PromotionStatus,
  UpdatePromotionInput,
} from "./promotion.types";

export class PromotionServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PromotionServiceError";
    this.statusCode = statusCode;
  }
}

function validateDates(startsAt: string | Date, endsAt: string | Date) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new PromotionServiceError("Invalid promotion dates");
  }

  if (end <= start) {
    throw new PromotionServiceError(
      "Promotion end date must be later than start date",
    );
  }
}

function toObjectIds(ids: string[] | undefined) {
  return (ids ?? []).map((id) => new Types.ObjectId(id));
}

function calculateInitialStatus(
  startsAt: Date,
  endsAt: Date,
): PromotionStatus {
  const now = new Date();

  if (endsAt <= now) return "EXPIRED";
  if (startsAt > now) return "SCHEDULED";
  return "ACTIVE";
}

export async function createPromotion(
  input: CreatePromotionInput,
  actorId?: string,
) {
  validateDates(input.startsAt, input.endsAt);

  if (input.type === "PERCENTAGE" && input.value > 100) {
    throw new PromotionServiceError("Percentage cannot exceed 100");
  }

  const existing = await Promotion.findOne({
    slug: input.slug.toLowerCase(),
  }).lean();

  if (existing) {
    throw new PromotionServiceError(
      "A promotion with this slug already exists",
      409,
    );
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  const promotion = await Promotion.create({
    ...input,
    slug: input.slug.toLowerCase(),
    currency: (input.currency ?? "BDT").toUpperCase(),
    startsAt,
    endsAt,
    applicableProductIds: toObjectIds(input.applicableProductIds),
    applicableCategoryIds: toObjectIds(input.applicableCategoryIds),
    status: "DRAFT",
    ...(actorId && Types.ObjectId.isValid(actorId)
      ? { createdBy: new Types.ObjectId(actorId) }
      : {}),
  });

  return promotion;
}

export async function getPromotionById(promotionId: string) {
  const promotion = await Promotion.findById(promotionId);

  if (!promotion) {
    throw new PromotionServiceError("Promotion not found", 404);
  }

  return promotion;
}

export async function getPromotionBySlug(slug: string) {
  const promotion = await Promotion.findOne({
    slug: slug.toLowerCase(),
  });

  if (!promotion) {
    throw new PromotionServiceError("Promotion not found", 404);
  }

  return promotion;
}

export async function getAllPromotions(query: PromotionQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Promotion.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Promotion.countDocuments(filter),
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

export async function getPublicPromotions() {
  const now = new Date();

  // Also excludes promotions whose usage limit has been reached.
  return Promotion.find({
    status: "ACTIVE",
    startsAt: { $lte: now },
    endsAt: { $gt: now },
    $or: [
      { usageLimit: { $exists: false } },
      { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
    ],
  }).sort({ startsAt: 1 });
}

export async function updatePromotion(
  promotionId: string,
  input: UpdatePromotionInput,
  actorId?: string,
) {
  const current = await getPromotionById(promotionId);

  const startsAt = input.startsAt
    ? new Date(input.startsAt)
    : current.startsAt;
  const endsAt = input.endsAt
    ? new Date(input.endsAt)
    : current.endsAt;

  validateDates(startsAt, endsAt);

  const type = input.type ?? current.type;
  const value = input.value ?? current.value;

  if (type === "PERCENTAGE" && value > 100) {
    throw new PromotionServiceError("Percentage cannot exceed 100");
  }

  if (input.slug && input.slug.toLowerCase() !== current.slug) {
    const duplicate = await Promotion.findOne({
      slug: input.slug.toLowerCase(),
      _id: { $ne: current._id },
    }).lean();

    if (duplicate) {
      throw new PromotionServiceError(
        "A promotion with this slug already exists",
        409,
      );
    }
  }

  // Keep status changes in the dedicated status endpoint.
  const updates: Record<string, unknown> = {
    ...input,
    startsAt,
    endsAt,
  };

  if (input.slug) updates.slug = input.slug.toLowerCase();
  if (input.currency) updates.currency = input.currency.toUpperCase();

  if (input.applicableProductIds) {
    updates.applicableProductIds = toObjectIds(input.applicableProductIds);
  }

  if (input.applicableCategoryIds) {
    updates.applicableCategoryIds = toObjectIds(input.applicableCategoryIds);
  }

  delete updates.status;

  if (actorId && Types.ObjectId.isValid(actorId)) {
    updates.updatedBy = new Types.ObjectId(actorId);
  }

  const updated = await Promotion.findByIdAndUpdate(
    promotionId,
    { $set: updates },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw new PromotionServiceError("Promotion not found", 404);
  }

  return updated;
}

export async function changePromotionStatus(
  promotionId: string,
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED",
  actorId?: string,
) {
  const promotion = await getPromotionById(promotionId);

  if (promotion.status === "ARCHIVED") {
    throw new PromotionServiceError("Archived promotions cannot be changed");
  }

  if (status === "ACTIVE") {
    const now = new Date();

    if (promotion.endsAt <= now) {
      throw new PromotionServiceError(
        "An expired promotion cannot be activated",
      );
    }

    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      throw new PromotionServiceError(
        "Promotion usage limit has been reached",
      );
    }

    const overlapsFuture = promotion.startsAt > now;
    status = overlapsFuture ? "DRAFT" : "ACTIVE";
  }

  const update: Record<string, unknown> = { status };

  if (actorId && Types.ObjectId.isValid(actorId)) {
    update.updatedBy = new Types.ObjectId(actorId);
  }

  const updated = await Promotion.findByIdAndUpdate(
    promotionId,
    { $set: update },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw new PromotionServiceError("Promotion not found", 404);
  }

  return updated;
}

export async function deletePromotion(promotionId: string) {
  const promotion = await getPromotionById(promotionId);

  if (promotion.usageCount > 0) {
    throw new PromotionServiceError(
      "A used promotion cannot be deleted; archive it instead",
      409,
    );
  }

  await Promotion.findByIdAndDelete(promotionId);

  return { message: "Promotion deleted successfully" };
}

export async function refreshPromotionStatuses() {
  const now = new Date();

  const [expired, scheduled] = await Promise.all([
    Promotion.updateMany(
      {
        status: { $in: ["ACTIVE", "SCHEDULED"] },
        endsAt: { $lte: now },
      },
      { $set: { status: "EXPIRED" } },
    ),
    Promotion.updateMany(
      {
        status: { $in: ["DRAFT", "SCHEDULED"] },
        startsAt: { $lte: now },
        endsAt: { $gt: now },
      },
      { $set: { status: "ACTIVE" } },
    ),
  ]);

  return {
    expiredCount: expired.modifiedCount,
    activatedCount: scheduled.modifiedCount,
  };
}
