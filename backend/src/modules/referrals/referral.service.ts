import { Types } from "mongoose";

import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";

import { ReferralCodeModel, ReferralModel } from "./referral.model";

import type { ReferralHistoryQuery } from "./referral.types";

function generateReferralCode(): string {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `NPT-${random}`;
}

function validateUserId(userId: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid user ID");
  }

  return new Types.ObjectId(userId);
}

async function requireActiveUser(userId: string) {
  const userObjectId = validateUserId(userId);

  const user = await User.findById(userObjectId)
    .select("_id name status")
    .lean();

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.status !== "ACTIVE") {
    throw ApiError.forbidden("Your account cannot use referrals");
  }

  return userObjectId;
}

/**
 * Returns the user's existing code or creates one.
 * A referral code is stable for the lifetime of its record.
 */
export async function getOrCreateMyReferralCode(userId: string) {
  const referrerId = await requireActiveUser(userId);

  const existing = await ReferralCodeModel.findOne({
    referrerId,
  }).lean();

  if (existing) {
    if (!existing.isActive) {
      throw ApiError.forbidden("Your referral code is inactive");
    }

    return {
      code: existing.code,
      isActive: existing.isActive,
      createdAt: existing.createdAt,
    };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const code = generateReferralCode();

      const created = await ReferralCodeModel.create({
        referrerId,
        code,
        isActive: true,
      });

      return {
        code: created.code,
        isActive: created.isActive,
        createdAt: created.createdAt,
      };
    } catch (error: unknown) {
      const mongoError = error as { code?: number };

      if (mongoError.code !== 11000) {
        throw error;
      }

      // Concurrent requests may have created this user's code already.
      const concurrentCode = await ReferralCodeModel.findOne({
        referrerId,
      }).lean();

      if (concurrentCode) {
        if (!concurrentCode.isActive) {
          throw ApiError.forbidden("Your referral code is inactive");
        }

        return {
          code: concurrentCode.code,
          isActive: concurrentCode.isActive,
          createdAt: concurrentCode.createdAt,
        };
      }
    }
  }

  throw ApiError.conflict("Could not create a unique referral code. Retry.");
}

/**
 * Applies a referral code to the authenticated user.
 * Applying a code does not issue a reward.
 */
export async function applyReferralCode(userId: string, rawCode: string) {
  const referredUserId = await requireActiveUser(userId);
  const code = rawCode.trim().toUpperCase();

  const referralCode = await ReferralCodeModel.findOne({
    code,
    isActive: true,
  }).lean();

  if (!referralCode) {
    throw ApiError.notFound("Referral code not found or inactive");
  }

  if (referralCode.referrerId.equals(referredUserId)) {
    throw ApiError.badRequest("You cannot use your own referral code");
  }

  const existingReferral = await ReferralModel.findOne({
    referredUserId,
  }).lean();

  if (existingReferral) {
    throw ApiError.conflict("You have already used a referral code");
  }

  const referrer = await User.findById(referralCode.referrerId)
    .select("_id status")
    .lean();

  if (!referrer || referrer.status !== "ACTIVE") {
    throw ApiError.badRequest("The referral owner is not eligible");
  }

  try {
    const referral = await ReferralModel.create({
      referrerId: referralCode.referrerId,
      referredUserId,
      referralCode: referralCode.code,
      status: "PENDING",
    });

    return {
      id: referral._id,
      code: referral.referralCode,
      status: referral.status,
      createdAt: referral.createdAt,
      message: "Referral applied successfully. Rewards are not issued yet.",
    };
  } catch (error: unknown) {
    const mongoError = error as { code?: number };

    if (mongoError.code === 11000) {
      throw ApiError.conflict("A referral has already been applied");
    }

    throw error;
  }
}

export async function getMyReferralSummary(userId: string) {
  const referrerId = await requireActiveUser(userId);

  const code = await ReferralCodeModel.findOne({
    referrerId,
  }).lean();

  const counts = await ReferralModel.aggregate([
    { $match: { referrerId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    total: 0,
    pending: 0,
    qualified: 0,
    rewarded: 0,
    rejected: 0,
  };

  for (const item of counts) {
    const count = Number(item.count ?? 0);
    summary.total += count;

    switch (item._id) {
      case "PENDING":
        summary.pending = count;
        break;
      case "QUALIFIED":
        summary.qualified = count;
        break;
      case "REWARDED":
        summary.rewarded = count;
        break;
      case "REJECTED":
        summary.rejected = count;
        break;
    }
  }

  return {
    referralCode: code?.isActive ? code.code : null,
    codeActive: Boolean(code?.isActive),
    summary,
  };
}

export async function listMyReferrals(
  userId: string,
  filters: ReferralHistoryQuery,
) {
  const referrerId = await requireActiveUser(userId);
  const page = Math.max(1, filters.page);
  const limit = Math.min(100, Math.max(1, filters.limit));

  const query: Record<string, unknown> = { referrerId };

  if (filters.status) {
    query.status = filters.status;
  }

  const [items, total] = await Promise.all([
    ReferralModel.find(query)
      .select(
        "referrerId referredUserId referralCode status qualifiedAt rewardedAt createdAt",
      )
      .populate({
        path: "referredUserId",
        select: "name avatarUrl",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ReferralModel.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}
