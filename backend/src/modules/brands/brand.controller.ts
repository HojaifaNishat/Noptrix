import type { Request, Response } from "express";

import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";

import {
  createBrand,
  deleteBrand,
  getBrandById,
  getBrandBySlug,
  listBrands,
  updateBrand,
  updateBrandStatus,
  updateBrandSortOrder,
} from "./brand.service";

import type {
  BrandListQuery,
  CreateBrandInput,
  UpdateBrandInput,
} from "./brand.types";

type IdRequest = Request<{ brandId: string }>;
type SlugRequest = Request<{ slug: string }>;

type CreateRequest = Request<Record<string, never>, unknown, CreateBrandInput>;

type UpdateRequest = Request<{ brandId: string }, unknown, UpdateBrandInput>;

type ListRequest = Request;

type StatusRequest = Request<
  { brandId: string },
  unknown,
  { status: "ACTIVE" | "INACTIVE" }
>;

type SortOrderRequest = Request<
  { brandId: string },
  unknown,
  { sortOrder: number }
>;

export const createBrandController = asyncHandler(
  async (req: CreateRequest, res: Response): Promise<void> => {
    const file = req.file;

    const brand = await createBrand({
      ...req.body,
      image: file
        ? {
            buffer: file.buffer,
            filename: file.originalname,
            mimeType: file.mimetype,
          }
        : undefined,
      createdBy: getAuthenticatedAdminId(req),
    });

    res
      .status(201)
      .json(
        ApiResponse.created(brand, "Brand created successfully.").serialize(),
      );
  },
);

export const getBrandController = asyncHandler(
  async (req: IdRequest, res: Response): Promise<void> => {
    const brand = await getBrandById(req.params.brandId);

    res
      .status(200)
      .json(ApiResponse.ok(brand, "Brand retrieved successfully.").serialize());
  },
);

export const getBrandBySlugController = asyncHandler(
  async (req: SlugRequest, res: Response): Promise<void> => {
    const brand = await getBrandBySlug(req.params.slug);

    res
      .status(200)
      .json(ApiResponse.ok(brand, "Brand retrieved successfully.").serialize());
  },
);

export const listBrandsController = asyncHandler(
  async (req: ListRequest, res: Response): Promise<void> => {
    const result = await listBrands(req.query as unknown as BrandListQuery);

    res
      .status(200)
      .json(
        ApiResponse.ok(result, "Brands retrieved successfully.").serialize(),
      );
  },
);

export const listActiveBrandsController = asyncHandler(
  async (req: ListRequest, res: Response): Promise<void> => {
    const result = await listBrands(
      req.query as unknown as BrandListQuery,
      true,
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result,
          "Active brands retrieved successfully.",
        ).serialize(),
      );
  },
);

export const updateBrandController = asyncHandler(
  async (req: UpdateRequest, res: Response): Promise<void> => {
    const file = req.file;

    const brand = await updateBrand(req.params.brandId, {
      ...req.body,
      image: file
        ? {
            buffer: file.buffer,
            filename: file.originalname,
            mimeType: file.mimetype,
          }
        : undefined,
      updatedBy: getAuthenticatedAdminId(req),
    });

    res
      .status(200)
      .json(ApiResponse.ok(brand, "Brand updated successfully.").serialize());
  },
);

export const updateBrandStatusController = asyncHandler(
  async (req: StatusRequest, res: Response): Promise<void> => {
    const brand = await updateBrandStatus(
      req.params.brandId,
      req.body.status,
      getAuthenticatedAdminId(req),
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(brand, "Brand status updated successfully.").serialize(),
      );
  },
);

export const updateBrandSortOrderController = asyncHandler(
  async (req: SortOrderRequest, res: Response): Promise<void> => {
    const brand = await updateBrandSortOrder(
      req.params.brandId,
      req.body.sortOrder,
      getAuthenticatedAdminId(req),
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          brand,
          "Brand sort order updated successfully.",
        ).serialize(),
      );
  },
);

export const deleteBrandController = asyncHandler(
  async (req: IdRequest, res: Response): Promise<void> => {
    const result = await deleteBrand(req.params.brandId);

    res
      .status(200)
      .json(ApiResponse.ok(result, "Brand deleted successfully.").serialize());
  },
);
