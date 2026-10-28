import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import {
  deleteProductImage,
  getProductImage,
  listProductImages,
  updateProductImage,
  uploadProductImages,
} from "./image.service";

import type {
  ImageListQuery,
  ImageUpdateBody,
  ImageUploadBody,
} from "./image.validator";

interface ProductParams {
  productId: string;
}

interface ImageParams extends ProductParams {
  id: string;
}

export const uploadProductImagesController = asyncHandler(
  async (
    req: Request<ProductParams, unknown, ImageUploadBody>,
    res: Response,
  ) => {
    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const data = await uploadProductImages(
      req.params.productId,
      files,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Product images uploaded successfully.",
      data,
    });
  },
);

export const listProductImagesController = asyncHandler(
  async (
    req: Request<ProductParams, unknown, unknown, ImageListQuery>,
    res: Response,
  ) => {
    const data = await listProductImages(req.params.productId, req.query);

    res.status(200).json({
      success: true,
      message: "Product images retrieved successfully.",
      data,
    });
  },
);

export const getProductImageController = asyncHandler(
  async (req: Request<ImageParams>, res: Response) => {
    const data = await getProductImage(req.params.productId, req.params.id);

    res.status(200).json({
      success: true,
      message: "Product image retrieved successfully.",
      data,
    });
  },
);

export const updateProductImageController = asyncHandler(
  async (
    req: Request<ImageParams, unknown, ImageUpdateBody>,
    res: Response,
  ) => {
    const data = await updateProductImage(
      req.params.productId,
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Product image updated successfully.",
      data,
    });
  },
);

export const deleteProductImageController = asyncHandler(
  async (req: Request<ImageParams>, res: Response) => {
    const data = await deleteProductImage(req.params.productId, req.params.id);

    res.status(200).json({
      success: true,
      message: data.storageCleanupPending
        ? "Image deleted; Cloudinary cleanup is pending."
        : "Product image deleted successfully.",
      data,
    });
  },
);
