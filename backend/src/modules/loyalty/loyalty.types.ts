import type { Types } from "mongoose";

export interface LoyaltyTier {
  key: string;
  name: string;
  minLifetimePoints: number;
  earningMultiplier: number;
  benefits: string[];
  sortOrder: number;
  active: boolean;
}

export interface LoyaltyProgram {
  _id?: Types.ObjectId;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  pointsPerCurrencyUnit: number;
  minimumOrderAmount: number;
  eligiblePaymentStatuses: string[];
  eligibleOrderStatuses: string[];
  pointsExpiryDays: number | null;
  tiers: LoyaltyTier[];
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoyaltyMembershipTier {
  key: string;
  name: string;
  benefits: string[];
  earningMultiplier: number;
}

export interface LoyaltyMembership {
  program: {
    name: string;
    description: string;
    enabled: boolean;
    pointsPerCurrencyUnit: number;
    minimumOrderAmount: number;
    pointsExpiryDays: number | null;
  };
  membership: {
    tier: LoyaltyMembershipTier;
    lifetimeEarned: number;
    currentBalance: number;
    lifetimeRedeemed: number;
  };
  tiers: Array<{
    key: string;
    name: string;
    minLifetimePoints: number;
    earningMultiplier: number;
    benefits: string[];
  }>;
}

export interface AwardLoyaltyPointsInput {
  orderId: string;
}

export type LoyaltyTierKey = string;
