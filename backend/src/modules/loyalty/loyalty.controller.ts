import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  getLoyaltyProgram,
  updateLoyaltyProgram,
  getMyLoyaltyMembership,
} from "./loyalty.service";
import type { UpdateLoyaltyProgramInput } from "./loyalty.validator";

type AdminRequest = Request & {
  ownerAuth?: { ownerId?: string };
  adminAuth?: { adminId?: string; userId?: string };
};

function getActorId(req: Request): string {
  const request = req as AdminRequest;
  return String(
    request.ownerAuth?.ownerId ??
      request.adminAuth?.adminId ??
      request.adminAuth?.userId ??
      "SYSTEM",
  );
}

export const getLoyaltyProgramController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const program = await getLoyaltyProgram();

    res
      .status(200)
      .json(ApiResponse.ok(program, "Loyalty program retrieved.").serialize());
  },
);

export const updateLoyaltyProgramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const program = await updateLoyaltyProgram(
      req.body as UpdateLoyaltyProgramInput,
      getActorId(req),
    );

    res
      .status(200)
      .json(ApiResponse.ok(program, "Loyalty program updated.").serialize());
  },
);

export const getMyLoyaltyMembershipController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userAuth?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
      return;
    }

    const membership = await getMyLoyaltyMembership(userId);

    res
      .status(200)
      .json(
        ApiResponse.ok(membership, "Loyalty membership retrieved.").serialize(),
      );
  },
);
