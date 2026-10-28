import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createFlashSale,
  deleteFlashSale,
  getFlashSaleById,
  listActiveFlashSales,
  listFlashSales,
  updateFlashSale,
} from "./flash-sale.service";

function getParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest(`Invalid ${key}`);
  }

  return value;
}

function getActorId(req: Request): string | undefined {
  const user = (
    req as Request & {
      user?: { _id?: unknown; id?: unknown; userId?: unknown };
    }
  ).user;

  const id = user?._id ?? user?.id ?? user?.userId;
  return id == null ? undefined : String(id);
}

export const createFlashSaleController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await createFlashSale(req.body, getActorId(req));
    res.status(201).json({
      success: true,
      message: "Flash sale created",
      data,
    });
  },
);

export const listFlashSalesController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listFlashSales({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      status:
        req.query.status === "DRAFT" ||
        req.query.status === "ACTIVE" ||
        req.query.status === "INACTIVE"
          ? req.query.status
          : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const listActiveFlashSalesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await listActiveFlashSales();
    res.json({ success: true, data });
  },
);

export const getFlashSaleController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getFlashSaleById(getParam(req, "flashSaleId"));
    res.json({ success: true, data });
  },
);

export const updateFlashSaleController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateFlashSale(
      getParam(req, "flashSaleId"),
      req.body,
      getActorId(req),
    );

    res.json({ success: true, message: "Flash sale updated", data });
  },
);

export const deleteFlashSaleController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await deleteFlashSale(getParam(req, "flashSaleId"));
    res.json({ success: true, message: "Flash sale deleted", data });
  },
);
