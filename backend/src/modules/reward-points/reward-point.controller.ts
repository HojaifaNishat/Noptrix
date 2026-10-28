import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import {
  getMyRewardPointBalance,
  getMyRewardPointHistory,
  redeemRewardPoints,
} from "./reward-point.service";
import {
  redeemPointsSchema,
  rewardPointHistorySchema,
} from "./reward-point.validator";

export const getRewardPointBalanceController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await getMyRewardPointBalance(getAuthenticatedUserId(req));
    res
      .status(200)
      .json(ApiResponse.ok(result, "Reward points balance").serialize());
  },
);

export const getRewardPointHistoryController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = rewardPointHistorySchema.parse(req.query);
    const result = await getMyRewardPointHistory(
      getAuthenticatedUserId(req),
      query,
    );
    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.items,
          "Reward points history",
          result.pagination,
        ).serialize(),
      );
  },
);

export const redeemRewardPointsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = redeemPointsSchema.parse(req.body);
    const result = await redeemRewardPoints(
      getAuthenticatedUserId(req),
      input.points,
      input.description,
    );
    res
      .status(200)
      .json(ApiResponse.ok(result, "Reward points redeemed").serialize());
  },
);
