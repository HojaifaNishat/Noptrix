import type { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";

import {
  cancelPendingRefund,
  createRefund,
  getCustomerRefund,
  listRefunds,
  processRefund,
} from "./refund.service";

import type {
  CreateRefundInput,
  ProcessRefundInput,
  RefundListFilters,
} from "./refund.types";

function getParam(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest("A valid route parameter is required.");
  }

  return value;
}

export const createRefundController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);

    const result = await createRefund(userId, req.body as CreateRefundInput);

    res.status(201).json({
      success: true,
      message: "Refund request created successfully.",
      data: result,
    });
  },
);

export const getCustomerRefundController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const refundId = getParam(req.params.refundId);

    const result = await getCustomerRefund(userId, refundId);

    res.status(200).json({
      success: true,
      message: "Refund retrieved successfully.",
      data: result,
    });
  },
);

export const listRefundsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listRefunds(req.query as unknown as RefundListFilters);

    res.status(200).json({
      success: true,
      message: "Refunds retrieved successfully.",
      data: result.items,
      pagination: result.pagination,
    });
  },
);

/**
 * Admin-only controller.
 * Mount only behind admin authentication and refund permissions.
 */
export const processRefundController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = getAuthenticatedAdminId(req);
    const refundId = getParam(req.params.refundId);

    const result = await processRefund(
      refundId,
      adminId,
      req.body as ProcessRefundInput,
    );

    res.status(200).json({
      success: true,
      message: "Refund marked as processing.",
      data: result,
    });
  },
);

/**
 * Admin-only controller.
 */
export const cancelPendingRefundController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = getAuthenticatedAdminId(req);
    const refundId = getParam(req.params.refundId);

    const note =
      typeof req.body?.internalNote === "string"
        ? req.body.internalNote
        : undefined;

    const result = await cancelPendingRefund(refundId, adminId, note);

    res.status(200).json({
      success: true,
      message: "Pending refund cancelled successfully.",
      data: result,
    });
  },
);
