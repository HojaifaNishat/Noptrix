export const REWARD_POINT_TRANSACTION_TYPES = {
  EARN: "EARN",
  REDEEM: "REDEEM",
  REFUND: "REFUND",
  ADJUSTMENT: "ADJUSTMENT",
  EXPIRED: "EXPIRED",
} as const;

export type RewardPointTransactionType =
  (typeof REWARD_POINT_TRANSACTION_TYPES)[keyof typeof REWARD_POINT_TRANSACTION_TYPES];

export interface RewardPointHistoryQuery {
  page: number;
  limit: number;
  type?: RewardPointTransactionType;
}

export interface AwardPointsInput {
  userId: string;
  points: number;
  referenceId: string;
  description?: string;
}

export interface RedeemPointsInput {
  points: number;
  description?: string;
}
