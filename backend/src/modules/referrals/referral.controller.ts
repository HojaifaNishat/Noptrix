import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";

import {
  applyReferralCode,
  getMyReferralSummary,
  getOrCreateMyReferralCode,
  listMyReferrals,
} from "./referral.service";

import {
  applyReferralSchema,
  referralHistoryQuerySchema,
} from "./referral.validator";

export const getMyReferralCode = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const result = await getOrCreateMyReferralCode(userId);

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result,
          "Referral code fetched successfully",
        ).serialize(),
      );
  },
);

export const applyReferral = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const input = applyReferralSchema.parse(req.body);

    const result = await applyReferralCode(userId, input.code);

    res
      .status(201)
      .json(
        ApiResponse.created(
          result,
          "Referral applied successfully",
        ).serialize(),
      );
  },
);

export const getReferralSummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const result = await getMyReferralSummary(userId);

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result,
          "Referral summary fetched successfully",
        ).serialize(),
      );
  },
);

export const getReferralHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getAuthenticatedUserId(req);
    const filters = referralHistoryQuerySchema.parse(req.query);

    const result = await listMyReferrals(userId, filters);

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.items,
          "Referral history fetched successfully",
          result.pagination,
        ).serialize(),
      );
  },
);
