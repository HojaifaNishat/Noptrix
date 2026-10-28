import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { User } from "../users/user.model";
import OrderModel from "../orders/order.model";
import {
  getMyRewardPointBalance,
  awardRewardPoints,
} from "../reward-points/reward-point.service";
import LoyaltyProgramModel, {
  type LoyaltyProgram,
  type LoyaltyTier,
} from "./loyalty.model";
import type { UpdateLoyaltyProgramInput } from "./loyalty.validator";

async function requireActiveUser(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw ApiError.unauthorized("Invalid user identity.");
  }

  const user = await User.findById(userId).select("_id status").lean();

  if (!user) throw ApiError.notFound("User not found.");
  if (user.status !== "ACTIVE") {
    throw ApiError.forbidden("Your account is not active.");
  }

  return user;
}

export async function getOrCreateLoyaltyProgram() {
  try {
    return await LoyaltyProgramModel.findOneAndUpdate(
      { key: "DEFAULT" },
      { $setOnInsert: { key: "DEFAULT" } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      const existing = await LoyaltyProgramModel.findOne({ key: "DEFAULT" });
      if (existing) return existing;
    }
    throw error;
  }
}

export async function getLoyaltyProgram() {
  return getOrCreateLoyaltyProgram();
}

export async function updateLoyaltyProgram(
  input: UpdateLoyaltyProgramInput,
  actorId: string,
) {
  const program = await getOrCreateLoyaltyProgram();

  if (input.tiers) {
    const keys = input.tiers.map((tier) => tier.key.toUpperCase());
    if (new Set(keys).size !== keys.length) {
      throw ApiError.badRequest("Tier keys must be unique.");
    }
  }

  Object.assign(program, input, {
    updatedBy: actorId,
  });

  await program.save();
  return program;
}

export function calculateTier(
  lifetimeEarned: number,
  tiers: LoyaltyTier[],
): LoyaltyTier {
  const eligible = tiers
    .filter((tier) => tier.active && tier.minLifetimePoints <= lifetimeEarned)
    .sort(
      (a, b) =>
        b.minLifetimePoints - a.minLifetimePoints || a.sortOrder - b.sortOrder,
    );

  if (eligible.length) return eligible[0];

  const firstActive = tiers
    .filter((tier) => tier.active)
    .sort((a, b) => a.minLifetimePoints - b.minLifetimePoints)[0];

  if (!firstActive) {
    throw ApiError.internal("No active loyalty tier is configured.");
  }

  return firstActive;
}

export async function getMyLoyaltyMembership(userId: string) {
  await requireActiveUser(userId);

  const [program, balance] = await Promise.all([
    getOrCreateLoyaltyProgram(),
    getMyRewardPointBalance(userId),
  ]);

  const tier = calculateTier(balance.lifetimeEarned, program.tiers);

  return {
    program: {
      name: program.name,
      description: program.description,
      enabled: program.enabled,
      pointsPerCurrencyUnit: program.pointsPerCurrencyUnit,
      minimumOrderAmount: program.minimumOrderAmount,
      pointsExpiryDays: program.pointsExpiryDays,
    },
    membership: {
      tier: {
        key: tier.key,
        name: tier.name,
        benefits: tier.benefits,
        earningMultiplier: tier.earningMultiplier,
      },
      lifetimeEarned: balance.lifetimeEarned,
      currentBalance: balance.balance,
      lifetimeRedeemed: balance.lifetimeRedeemed,
    },
    tiers: program.tiers
      .filter((item) => item.active)
      .sort((a, b) => a.minLifetimePoints - b.minLifetimePoints)
      .map((item) => ({
        key: item.key,
        name: item.name,
        minLifetimePoints: item.minLifetimePoints,
        earningMultiplier: item.earningMultiplier,
        benefits: item.benefits,
      })),
  };
}

/**
 * Internal integration only.
 * Call after the order's final eligible payment and delivery status is saved.
 * The order ID is the stable idempotency reference.
 */
export async function awardLoyaltyPointsForOrder(orderId: string) {
  if (!Types.ObjectId.isValid(orderId)) {
    throw ApiError.badRequest("Invalid order ID.");
  }

  const [program, order] = await Promise.all([
    getOrCreateLoyaltyProgram(),
    OrderModel.findById(orderId),
  ]);

  if (!order) throw ApiError.notFound("Order not found.");
  if (!program.enabled) return { awarded: false, reason: "PROGRAM_DISABLED" };

  if (
    !program.eligiblePaymentStatuses.includes(order.paymentStatus) ||
    !program.eligibleOrderStatuses.includes(order.status)
  ) {
    return { awarded: false, reason: "ORDER_NOT_ELIGIBLE" };
  }

  const amount = Math.max(
    0,
    order.totals.totalAmount - (order.totals.refundedAmount ?? 0),
  );

  if (amount < program.minimumOrderAmount) {
    return { awarded: false, reason: "BELOW_MINIMUM_ORDER_AMOUNT" };
  }

  const [user, balance] = await Promise.all([
    User.findById(order.userId).select("_id status").lean(),
    getMyRewardPointBalance(String(order.userId)),
  ]);

  if (!user || user.status !== "ACTIVE") {
    return { awarded: false, reason: "USER_NOT_ACTIVE" };
  }

  const tier = calculateTier(balance.lifetimeEarned, program.tiers);
  const points = Math.floor(
    amount * program.pointsPerCurrencyUnit * tier.earningMultiplier,
  );

  if (!Number.isSafeInteger(points) || points <= 0) {
    return { awarded: false, reason: "NO_POINTS_TO_AWARD" };
  }

  const transaction = await awardRewardPoints({
    userId: String(order.userId),
    points,
    referenceId: String(order._id),
    description: `Loyalty points for order ${order.orderNumber}`,
  });

  return {
    awarded: true,
    points: transaction.points,
    tier: tier.key,
    transaction,
  };
}

export type LoyaltyProgramShape = LoyaltyProgram;
