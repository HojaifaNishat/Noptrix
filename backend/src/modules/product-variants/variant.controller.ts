import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as service from "./variant.service";

export const listVariantsController = asyncHandler(async (req: Request<{ productId: string }>, res: Response) => {
    res.status(200).json(ApiResponse.ok(await service.listProductVariants(req.params.productId, true), "Product variants retrieved successfully.").serialize());
});
export const createVariantController = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(ApiResponse.created(await service.createProductVariant(req.body), "Product variant created successfully.").serialize());
});
export const updateVariantController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(ApiResponse.ok(await service.updateProductVariant(req.params.id, req.body), "Product variant updated successfully.").serialize());
});
export const deleteVariantController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    await service.deleteProductVariant(req.params.id);
    res.status(204).send();
});
