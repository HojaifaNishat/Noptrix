import { Types } from "mongoose";

export const REFERRAL_STATUSES = {
  PENDING: "PENDING",
  QUALIFIED: "QUALIFIED",
  REWARDED: "REWARDED",
  REJECTED: "REJECTED",
} as const;

export type ReferralStatus =
  (typeof REFERRAL_STATUSES)[keyof typeof REFERRAL_STATUSES];

export interface IReferralCode {
  _id: Types.ObjectId;
  referrerId: Types.ObjectId;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferral {
  _id: Types.ObjectId;
  referrerId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  referralCode: string;
  status: ReferralStatus;
  qualifiedAt?: Date;
  rewardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralHistoryQuery {
  page: number;
  limit: number;
  status?: ReferralStatus;
}
