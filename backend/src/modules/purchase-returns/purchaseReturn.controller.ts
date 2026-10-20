import type { Request, Response } from "express";

import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

import * as purchaseReturnService from "./purchaseReturn.service";

import type {
  CreatePurchaseReturnBody,
  UpdatePurchaseReturnBody,
  PurchaseReturnQuery,
  ApprovePurchaseReturnBody,
  RejectPurchaseReturnBody,
  CompletePurchaseReturnBody,
  RecordPurchaseReturnRefundBody,
  CancelPurchaseReturnBody,
  PurchaseReturnSummaryQuery,
} from "./purchaseReturn.validator";

export const createPurchaseReturnController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminId = getAuthenticatedAdminId(req);

    const record = await purchaseReturnService.createPurchaseReturn(
      req.body as CreatePurchaseReturnBody,
      adminId,
    );

    res.status(201).json({
      success: true,
      message: "Purchase return requested successfully.",
      data: record,
    });
  },
);

export const listPurchaseReturnsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await purchaseReturnService.listPurchaseReturns(
      req.query as unknown as PurchaseReturnQuery,
    );

    res.status(200).json({
      success: true,
      message: "Purchase returns retrieved successfully.",
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const getPurchaseReturnController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const record = await purchaseReturnService.getPurchaseReturnById(
      String(req.params.id),
    );

    res.status(200).json({
      success: true,
      message: "Purchase return retrieved successfully.",
      data: record,
    });
  },
);

export const getPurchaseReturnByNumberController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const record = await purchaseReturnService.getPurchaseReturnByNumber(
      String(req.params.returnNumber),
    );

    res.status(200).json({
      success: true,
      message: "Purchase return retrieved successfully.",
      data: record,
    });
  },
);

export const updatePurchaseReturnController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminId = getAuthenticatedAdminId(req);

    const record = await purchaseReturnService.updatePurchaseReturn(
      String(req.params.id),
      req.body as UpdatePurchaseReturnBody,
      adminId,
    );

    res.status(200).json({
      success: true,
      message: "Purchase return updated successfully.",
      data: record,
    });
  },
);

export const approvePurchaseReturnController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminId = getAuthenticatedAdminId(req);

    const record = await purchaseReturnService.approvePurchaseReturn(
      String(req.params.id),
      req.body as ApprovePurchaseReturnBody,
      adminId,
    );

    res.status(200).json({
      success: true,
      message: "Purchase return approved successfully.",
      data: record,
    });
  },
);

export const rejectPurchaseReturnController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminId = getAuthenticatedAdminId(req);

    const record = await purchaseReturnService.rejectPurchaseReturn(
      String(req.params.id),
      req.body as RejectPurchaseReturnBody,
      adminId,
    );

    res.status(200).json({
      success: true,
      message: "Purchase return rejected successfully.",
      data: record,
    });
  },
);

export const completePurchaseReturnController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminId = getAuthenticatedAdminId(req);

    const record = await purchaseReturnService.completePurchaseReturn(
      String(req.params.id),
      req.body as CompletePurchaseReturnBody,
      adminId,
    );

    res.status(200).json({
      success: true,
      message: "Purchase return completed successfully.",
      data: record,
    });
  },
);

export const recordPurchaseReturnRefundController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminId = getAuthenticatedAdminId(req);

    const record = await purchaseReturnService.recordPurchaseReturnRefund(
      String(req.params.id),
      req.body as RecordPurchaseReturnRefundBody,
      adminId,
    );

    res.status(200).json({
      success: true,
      message: "Supplier refund recorded successfully.",
      data: record,
    });
  },
);

export const cancelPurchaseReturnController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const adminId = getAuthenticatedAdminId(req);

    const record = await purchaseReturnService.cancelPurchaseReturn(
      String(req.params.id),
      req.body as CancelPurchaseReturnBody,
      adminId,
    );

    res.status(200).json({
      success: true,
      message: "Purchase return cancelled successfully.",
      data: record,
    });
  },
);

export const getPurchaseReturnSummaryController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const summary = await purchaseReturnService.getPurchaseReturnSummary(
      req.query as unknown as PurchaseReturnSummaryQuery,
    );

    res.status(200).json({
      success: true,
      message: "Purchase return summary retrieved successfully.",
      data: summary,
    });
  },
);
