import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import {
  createReceiptForOrder,
  getMyReceipt,
  getMyReceiptForOrder,
  listMyReceipts,
} from "./receipt.service";
import { receiptListQuerySchema } from "./receipt.validator";

export const createReceipt = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const orderId = String(req.params.orderId ?? "");

    const result = await createReceiptForOrder(orderId, userId);

    const response = result.created
      ? ApiResponse.created(result.receipt, "Receipt issued successfully")
      : ApiResponse.ok(result.receipt, "Receipt already exists");

    res.status(result.created ? 201 : 200).json(response.serialize());
  },
);

export const listReceipts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const filters = receiptListQuerySchema.parse(req.query);
    const result = await listMyReceipts(userId, filters);

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.items,
          "Receipts fetched successfully",
          result.pagination,
        ).serialize(),
      );
  },
);

export const getReceipt = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req);
  const receiptId = String(req.params.receiptId ?? "");
  const receipt = await getMyReceipt(receiptId, userId);

  res
    .status(200)
    .json(ApiResponse.ok(receipt, "Receipt fetched successfully").serialize());
});

export const getReceiptByOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const orderId = String(req.params.orderId ?? "");
    const receipt = await getMyReceiptForOrder(orderId, userId);

    res
      .status(200)
      .json(
        ApiResponse.ok(receipt, "Receipt fetched successfully").serialize(),
      );
  },
);
