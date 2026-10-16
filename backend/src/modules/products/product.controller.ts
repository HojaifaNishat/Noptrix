import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import * as service from "./product.service";

export const listProductsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listProducts(req.query as Record<string, unknown>, true);
  res.status(200).json(ApiResponse.ok(result.items, "Products retrieved successfully.", result.pagination).serialize());
});

export const listAdminProductsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listProducts(req.query as Record<string, unknown>);
  res.status(200).json(ApiResponse.ok(result.items, "Products retrieved successfully.", result.pagination).serialize());
});

export const getProductController = asyncHandler(async (req: Request<{ productId: string }>, res: Response) => {
  const product = await service.getProductById(req.params.productId);
  res.status(200).json(ApiResponse.ok(product, "Product retrieved successfully.").serialize());
});

export const getProductBySlugController = asyncHandler(async (req: Request<{ slug: string }>, res: Response) => {
  const product = await service.getProductBySlug(req.params.slug);
  res.status(200).json(ApiResponse.ok(product, "Product retrieved successfully.").serialize());
});

export const createProductController = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.createProduct({ ...req.body, createdBy: getAuthenticatedAdminId(req) });
  res.status(201).json(ApiResponse.created(product, "Product created successfully.").serialize());
});

export const updateProductController = asyncHandler(async (req: Request<{ productId: string }>, res: Response) => {
  const product = await service.updateProduct(req.params.productId, {
    ...req.body,
    updatedBy: getAuthenticatedAdminId(req),
  });
  res.status(200).json(ApiResponse.ok(product, "Product updated successfully.").serialize());
});

export const updateProductStatusController = asyncHandler(async (req: Request<{ productId: string }>, res: Response) => {
  const product = await service.updateProductStatus(req.params.productId, req.body.status);
  res.status(200).json(ApiResponse.ok(product, "Product status updated successfully.").serialize());
});

export const deleteProductController = asyncHandler(async (req: Request<{ productId: string }>, res: Response) => {
  await getAuthenticatedAdminId(req);
  await service.deleteProduct(req.params.productId);
  res.status(204).send();
});
