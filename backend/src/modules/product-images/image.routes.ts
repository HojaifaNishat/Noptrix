import { Router, type RequestHandler } from "express";

import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { requirePermissionMatch } from "../../middlewares/permission.middleware";
import { validateRequest } from "../../middlewares/validation.middleware";
import {
  uploadProductImages as uploadImagesMiddleware,
} from "../../middlewares/upload.middleware";

import {
  deleteProductImageController,
  getProductImageController,
  listProductImagesController,
  updateProductImageController,
  uploadProductImagesController,
} from "./image.controller";

import {
  imageListQuerySchema,
  imageUpdateBodySchema,
  imageUploadBodySchema,
  productImageIdParamsSchema,
  productImageParamsSchema,
} from "./image.validator";

const router = Router();

const routeHandler = (handler: unknown): RequestHandler =>
  handler as RequestHandler;

router.use(adminAuth);

router.get(
  "/:productId",
  requirePermissionMatch("products.read"),
  validateRequest({
    params: productImageParamsSchema,
    query: imageListQuerySchema,
  }),
  routeHandler(listProductImagesController),
);

router.post(
  "/:productId",
  requirePermissionMatch("products.create"),
  validateRequest({ params: productImageParamsSchema }),
  uploadImagesMiddleware,
  validateRequest({ body: imageUploadBodySchema }),
  routeHandler(uploadProductImagesController),
);

router.get(
  "/:productId/:id",
  requirePermissionMatch("products.read"),
  validateRequest({ params: productImageIdParamsSchema }),
  routeHandler(getProductImageController),
);

router.patch(
  "/:productId/:id",
  requirePermissionMatch("products.update"),
  validateRequest({
    params: productImageIdParamsSchema,
    body: imageUpdateBodySchema,
  }),
  routeHandler(updateProductImageController),
);

router.delete(
  "/:productId/:id",
  requirePermissionMatch("products.delete"),
  validateRequest({ params: productImageIdParamsSchema }),
  routeHandler(deleteProductImageController),
);

export default router;
