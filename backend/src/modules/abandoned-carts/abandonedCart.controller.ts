
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getAbandonedCartAnalytics,
  listAbandonedCarts,
  recoverAbandonedCart,
} from "./abandonedCart.service";

export const recoverAbandonedCartController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await recoverAbandonedCart(req.body.token);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },
);

export const listAbandonedCartsController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as {
      status?: "OPEN" | "RECOVERED" | "CONVERTED" | "EXPIRED";
      userId?: string;
      from?: string;
      to?: string;
      page?: number | string;
      limit?: number | string;
    };

    const result = await listAbandonedCarts({
      status: query.status,
      userId: query.userId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    });

    res.status(200).json({
      success: true,
      message: "Abandoned carts retrieved successfully",
      data: result,
    });
  },
);

export const abandonedCartAnalyticsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await getAbandonedCartAnalytics();

    res.status(200).json({
      success: true,
      message: "Abandoned cart analytics retrieved successfully",
      data,
    });
  },
);
