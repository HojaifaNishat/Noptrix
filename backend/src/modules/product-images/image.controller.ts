import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as service from "./image.service";

export const listImagesController = asyncHandler(async (req: Request<{ productId: string }>, res: Response) => {
    const images = await service.listProductImages(req.params.productId);
    res.status(200).json(ApiResponse.ok(images, "Product images retrieved successfully.").serialize());
});
export const createImageController = asyncHandler(async (req: Request, res: Response) => {
    const image = await service.createProductImage(req.body);
    res.status(201).json(ApiResponse.created(image, "Product image created successfully.").serialize());
});
export const updateImageController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const image = await service.updateProductImage(req.params.id, req.body);
    res.status(200).json(ApiResponse.ok(image, "Product image updated successfully.").serialize());
});
export const deleteImageController = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    await service.deleteProductImage(req.params.id);
    res.status(204).send();
});
