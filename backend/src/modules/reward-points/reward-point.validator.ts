import { z } from "zod";
import { REWARD_POINT_TRANSACTION_TYPES } from "./reward-point.types";

export const redeemPointsSchema = z.object({
  points: z.coerce.number().int().min(1).max(1000000),
  description: z.string().trim().max(250).optional(),
});

export const rewardPointHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z
    .enum([
      REWARD_POINT_TRANSACTION_TYPES.EARN,
      REWARD_POINT_TRANSACTION_TYPES.REDEEM,
      REWARD_POINT_TRANSACTION_TYPES.REFUND,
      REWARD_POINT_TRANSACTION_TYPES.ADJUSTMENT,
      REWARD_POINT_TRANSACTION_TYPES.EXPIRED,
    ])
    .optional(),
});
