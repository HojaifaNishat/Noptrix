import type { Request, Response } from "express";

import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

import * as supplierService from "./supplier.service";
import type { SupplierFilters } from "./supplier.types";
import type {
  CreateSupplierBody,
  UpdateSupplierBody,
  UpdateSupplierStatusBody,
  SupplierQuery,
} from "./supplier.validator";

export const createSupplierController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = getAuthenticatedAdminId(req);

    const supplier = await supplierService.createSupplier(
      req.body as CreateSupplierBody,
      adminId,
    );

    res
      .status(201)
      .json(ApiResponse.created(supplier, "Supplier created successfully."));
  },
);

export const listSuppliersController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as SupplierQuery;

    const filters: SupplierFilters = {
      search: query.search,
      status: query.status,
      city: query.city,
      country: query.country,
      tags: query.tags
        ? Array.isArray(query.tags)
          ? query.tags
          : [query.tags]
        : undefined,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const result = await supplierService.listSuppliers(filters);

    res
      .status(200)
      .json(ApiResponse.ok(result, "Suppliers retrieved successfully."));
  },
);

export const getSupplierController = asyncHandler(
  async (req: Request, res: Response) => {
    const supplier = await supplierService.getSupplierById(
      String(req.params.id),
    );

    res
      .status(200)
      .json(ApiResponse.ok(supplier, "Supplier retrieved successfully."));
  },
);

export const getSupplierByCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const supplier = await supplierService.getSupplierByCode(
      String(req.params.code),
    );

    res
      .status(200)
      .json(ApiResponse.ok(supplier, "Supplier retrieved successfully."));
  },
);

export const updateSupplierController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = getAuthenticatedAdminId(req);

    const supplier = await supplierService.updateSupplier(
      String(req.params.id),
      req.body as UpdateSupplierBody,
      adminId,
    );

    res
      .status(200)
      .json(ApiResponse.ok(supplier, "Supplier updated successfully."));
  },
);

export const updateSupplierStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = getAuthenticatedAdminId(req);

    const supplier = await supplierService.updateSupplierStatus(
      String(req.params.id),
      req.body as UpdateSupplierStatusBody,
      adminId,
    );

    res
      .status(200)
      .json(ApiResponse.ok(supplier, "Supplier status updated successfully."));
  },
);

export const deactivateSupplierController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = getAuthenticatedAdminId(req);

    const supplier = await supplierService.deactivateSupplier(
      String(req.params.id),
      adminId,
    );

    res
      .status(200)
      .json(ApiResponse.ok(supplier, "Supplier deactivated successfully."));
  },
);

export const getSupplierSummaryController = asyncHandler(
  async (_req: Request, res: Response) => {
    const summary = await supplierService.getSupplierSummary();

    res
      .status(200)
      .json(
        ApiResponse.ok(summary, "Supplier summary retrieved successfully."),
      );
  },
);
