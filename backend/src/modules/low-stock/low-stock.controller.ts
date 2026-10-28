import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./low-stock.service";
import type { LowStockQuery } from "./low-stock.types";

function readFilters(req: Request): LowStockQuery {
  const query = req.query;

  return {
    page: Number(query.page ?? 1),
    limit: Number(query.limit ?? 20),
    search: typeof query.search === "string" ? query.search : undefined,
    warehouseId:
      typeof query.warehouseId === "string" ? query.warehouseId : undefined,
    productId:
      typeof query.productId === "string" ? query.productId : undefined,
    status:
      query.status === "LOW_STOCK" || query.status === "OUT_OF_STOCK"
        ? query.status
        : "ALL",
    sortBy:
      query.sortBy === "quantity" || query.sortBy === "createdAt"
        ? query.sortBy
        : "updatedAt",
    sortOrder: query.sortOrder === "desc" ? "desc" : "asc",
  };
}

export const listLowStockController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await service.listLowStock(readFilters(req));

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.items,
          "Low-stock inventory retrieved.",
          result.pagination,
        ),
      );
  },
);

export const lowStockSummaryController = asyncHandler(
  async (req: Request, res: Response) => {
    const filters = readFilters(req);
    const result = await service.getLowStockSummary(filters);

    res.status(200).json(ApiResponse.ok(result, "Stock summary retrieved."));
  },
);
