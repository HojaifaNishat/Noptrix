import type { Request, Response } from "express";

import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

import * as service from "./stockTransfer.service";
import type {
  CreateStockTransferInput,
  StockTransferFilters,
} from "./stockTransfer.types";

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const createStockTransferController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateStockTransferInput;
    const headerKey = req.get("Idempotency-Key");

    const input: CreateStockTransferInput = {
      ...body,
      idempotencyKey: body.idempotencyKey ?? headerKey ?? undefined,
    };

    const transfer = await service.createStockTransfer(
      input,
      getAuthenticatedAdminId(req),
    );

    res
      .status(201)
      .json(
        ApiResponse.created(transfer, "Stock transfer created successfully."),
      );
  },
);

export const listStockTransfersController = asyncHandler(
  async (req: Request, res: Response) => {
    const filters: StockTransferFilters = {
      productId: getQueryString(req.query.productId),

      sourceWarehouseId: getQueryString(req.query.sourceWarehouseId),

      destinationWarehouseId: getQueryString(req.query.destinationWarehouseId),

      status: getQueryString(req.query.status) as
        StockTransferFilters["status"] | undefined,

      referenceType: getQueryString(req.query.referenceType),

      referenceId: getQueryString(req.query.referenceId),

      fromDate: getQueryString(req.query.fromDate),

      toDate: getQueryString(req.query.toDate),

      page: Number(req.query.page ?? 1),

      limit: Number(req.query.limit ?? 20),

      sortOrder: req.query.sortOrder === "asc" ? "asc" : "desc",
    };

    const result = await service.listStockTransfers(filters);

    res
      .status(200)
      .json(ApiResponse.ok(result, "Stock transfers retrieved successfully."));
  },
);

export const getStockTransferController = asyncHandler(
  async (req: Request, res: Response) => {
    const transfer = await service.getStockTransfer(String(req.params.id));

    res
      .status(200)
      .json(ApiResponse.ok(transfer, "Stock transfer retrieved successfully."));
  },
);

export const approveStockTransferController = asyncHandler(
  async (req: Request, res: Response) => {
    const transfer = await service.approveStockTransfer(
      String(req.params.id),
      getAuthenticatedAdminId(req),
      req.body.note,
    );

    res.status(200).json(ApiResponse.ok(transfer, "Stock transfer approved."));
  },
);

export const rejectStockTransferController = asyncHandler(
  async (req: Request, res: Response) => {
    const transfer = await service.rejectStockTransfer(
      String(req.params.id),
      getAuthenticatedAdminId(req),
      req.body.note,
    );

    res.status(200).json(ApiResponse.ok(transfer, "Stock transfer rejected."));
  },
);

export const dispatchStockTransferController = asyncHandler(
  async (req: Request, res: Response) => {
    const transfer = await service.dispatchStockTransfer(
      String(req.params.id),
      getAuthenticatedAdminId(req),
      req.body.note,
    );

    res
      .status(200)
      .json(ApiResponse.ok(transfer, "Stock transfer dispatched."));
  },
);

export const receiveStockTransferController = asyncHandler(
  async (req: Request, res: Response) => {
    const transfer = await service.receiveStockTransfer(
      String(req.params.id),
      getAuthenticatedAdminId(req),
      req.body.note,
    );

    res.status(200).json(ApiResponse.ok(transfer, "Stock transfer received."));
  },
);

export const cancelStockTransferController = asyncHandler(
  async (req: Request, res: Response) => {
    const transfer = await service.cancelStockTransfer(
      String(req.params.id),
      getAuthenticatedAdminId(req),
      req.body.note,
    );

    res.status(200).json(ApiResponse.ok(transfer, "Stock transfer cancelled."));
  },
);
