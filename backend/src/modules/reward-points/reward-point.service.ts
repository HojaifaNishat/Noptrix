import mongoose, { Types } from "mongoose";
import { User } from "../users/user.model";
import { ApiError } from "../../utils/ApiError";
import {
  RewardPointAccountModel,
  RewardPointTransactionModel,
  type RewardPointTransactionDocument,
} from "./reward-point.model";
import { REWARD_POINT_TRANSACTION_TYPES } from "./reward-point.types";

function validId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

async function requireActiveUser(userId: string) {
  if (!validId(userId)) {
    throw ApiError.unauthorized("Invalid user ID");
  }

  const user = await User.findById(userId).select("_id status").lean();

  if (!user) throw ApiError.notFound("User not found");
  if (user.status !== "ACTIVE") {
    throw ApiError.forbidden("Your account is not active");
  }

  return user;
}

async function ensureAccount(userId: string) {
  try {
    const account = await RewardPointAccountModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $setOnInsert: { balance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (!account)
      throw ApiError.internal("Reward account could not be created");
    return account;
  } catch (error: unknown) {
    // Concurrent first requests may race on the unique userId index.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const existing = await RewardPointAccountModel.findOne({ userId });
      if (existing) return existing;
    }
    throw error;
  }
}

/**
 * Internal service: call from trusted order/payment logic after the order
 * qualifies for points. Never expose this as a customer-controlled endpoint.
 *
 * The caller must supply a stable, unique referenceId, normally the order ID.
 * Requires MongoDB transaction support (replica set or sharded cluster).
 */
export async function awardRewardPoints(input: {
  userId: string;
  points: number;
  referenceId: string;
  description?: string;
}) {
  if (!validId(input.userId)) {
    throw ApiError.badRequest("Invalid user ID");
  }
  if (!Number.isSafeInteger(input.points) || input.points < 1) {
    throw ApiError.badRequest("Points must be a positive integer");
  }
  if (!input.referenceId?.trim() || input.referenceId.length > 150) {
    throw ApiError.badRequest("A valid reference ID is required");
  }

  await requireActiveUser(input.userId);
  await ensureAccount(input.userId);

  const session = await mongoose.startSession();
  let result: RewardPointTransactionDocument | undefined;

  try {
    await session.withTransaction(async () => {
      const userObjectId = new Types.ObjectId(input.userId);

      const existing = await RewardPointTransactionModel.findOne({
        userId: userObjectId,
        type: REWARD_POINT_TRANSACTION_TYPES.EARN,
        referenceId: input.referenceId,
      }).session(session);

      if (existing) {
        result = existing;
        return;
      }

      const account = await RewardPointAccountModel.findOneAndUpdate(
        { userId: userObjectId },
        {
          $inc: {
            balance: input.points,
            lifetimeEarned: input.points,
          },
        },
        { new: true, session },
      );

      if (!account) throw ApiError.internal("Reward account not found");

      const [transaction] = await RewardPointTransactionModel.create(
        [
          {
            userId: userObjectId,
            type: REWARD_POINT_TRANSACTION_TYPES.EARN,
            points: input.points,
            balanceAfter: account.balance,
            referenceId: input.referenceId,
            description: input.description ?? "Reward points earned",
          },
        ],
        { session },
      );

      if (!transaction) {
        throw ApiError.internal("Reward transaction could not be created");
      }

      result = transaction;
    });

    if (!result) {
      throw ApiError.internal("Reward transaction was not completed");
    }

    return result;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const existing = await RewardPointTransactionModel.findOne({
        userId: input.userId,
        type: REWARD_POINT_TRANSACTION_TYPES.EARN,
        referenceId: input.referenceId,
      });
      if (existing) return existing;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function redeemRewardPoints(
  userId: string,
  points: number,
  description?: string,
) {
  await requireActiveUser(userId);

  if (!Number.isSafeInteger(points) || points < 1) {
    throw ApiError.badRequest("Points must be a positive integer");
  }

  await ensureAccount(userId);

  const session = await mongoose.startSession();
  let result:
    | {
        transaction: RewardPointTransactionDocument;
        balance: number;
        lifetimeRedeemed: number;
      }
    | undefined;

  try {
    await session.withTransaction(async () => {
      // Atomic conditional update prevents concurrent overspending.
      const account = await RewardPointAccountModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          balance: { $gte: points },
        },
        {
          $inc: {
            balance: -points,
            lifetimeRedeemed: points,
          },
        },
        { new: true, session },
      );

      if (!account) {
        throw ApiError.badRequest("Insufficient reward points");
      }

      const [transaction] = await RewardPointTransactionModel.create(
        [
          {
            userId: new Types.ObjectId(userId),
            type: REWARD_POINT_TRANSACTION_TYPES.REDEEM,
            points,
            balanceAfter: account.balance,
            description: description ?? "Reward points redeemed",
          },
        ],
        { session },
      );

      if (!transaction) {
        throw ApiError.internal("Reward transaction could not be created");
      }

      result = {
        transaction,
        balance: account.balance,
        lifetimeRedeemed: account.lifetimeRedeemed,
      };
    });

    if (!result) {
      throw ApiError.internal("Reward redemption was not completed");
    }

    return result;
  } finally {
    await session.endSession();
  }
}

export async function getMyRewardPointBalance(userId: string) {
  await requireActiveUser(userId);
  const account = await ensureAccount(userId);

  return {
    balance: account.balance,
    lifetimeEarned: account.lifetimeEarned,
    lifetimeRedeemed: account.lifetimeRedeemed,
  };
}

export async function getMyRewardPointHistory(
  userId: string,
  options: {
    page: number;
    limit: number;
    type?: string;
  },
) {
  await requireActiveUser(userId);

  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
  };

  if (options.type) filter.type = options.type;

  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    RewardPointTransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    RewardPointTransactionModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}
