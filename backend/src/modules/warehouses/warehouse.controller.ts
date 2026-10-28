import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import * as service from "./warehouse.service";

export const listWarehousesController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await service.listWarehouses({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      status:
        req.query.status === "ACTIVE" || req.query.status === "INACTIVE"
          ? req.query.status
          : undefined,
      city: typeof req.query.city === "string" ? req.query.city : undefined,
      country:
        typeof req.query.country === "string" ? req.query.country : undefined,
      sortBy:
        req.query.sortBy === "code" ||
        req.query.sortBy === "createdAt" ||
        req.query.sortBy === "updatedAt"
          ? req.query.sortBy
          : "name",
      sortOrder: req.query.sortOrder === "desc" ? "desc" : "asc",
    });

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.items,
          "Warehouses retrieved.",
          result.pagination,
        ),
      );
  },
);

export const getWarehouseController = asyncHandler(
  async (req: Request, res: Response) => {
    const warehouse = await service.getWarehouse(String(req.params.id));
    res.status(200).json(ApiResponse.ok(warehouse, "Warehouse retrieved."));
  },
);

export const createWarehouseController = asyncHandler(
  async (req: Request, res: Response) => {
    const warehouse = await service.createWarehouse(
      req.body,
      getAuthenticatedAdminId(req),
    );

    res.status(201).json(ApiResponse.created(warehouse, "Warehouse created."));
  },
);

export const updateWarehouseController = asyncHandler(
  async (req: Request, res: Response) => {
    const warehouse = await service.updateWarehouse(
      String(req.params.id),
      req.body,
      getAuthenticatedAdminId(req),
    );

    res.status(200).json(ApiResponse.ok(warehouse, "Warehouse updated."));
  },
);

export const deactivateWarehouseController = asyncHandler(
  async (req: Request, res: Response) => {
    const warehouse = await service.deactivateWarehouse(
      String(req.params.id),
      getAuthenticatedAdminId(req),
    );

    res.status(200).json(ApiResponse.ok(warehouse, "Warehouse deactivated."));
  },
);

export const activateWarehouseController = asyncHandler(
  async (req: Request, res: Response) => {
    const warehouse = await service.activateWarehouse(
      String(req.params.id),
      getAuthenticatedAdminId(req),
    );

    res.status(200).json(ApiResponse.ok(warehouse, "Warehouse activated."));
  },
);
