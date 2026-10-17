import { Router } from "express";

import {
  createProductController,
  listProductsController,
  listPublicProductsController,
  getProductController,
  getProductBySlugController,
  updateProductController,
  updateProductStatusController,
  archiveProductController,
} from "./product.controller";

import {
  createProductSchema,
  updateProductSchema,
  productIdParamsSchema,
  productSlugParamsSchema,
  listProductsSchema,
  updateProductStatusSchema,
} from "./product.validator";

import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { requirePermissionMatch } from "../../middlewares/permission.middleware";
import { validateRequest } from "../../middlewares/validation.middleware";

const router = Router();

/*
 * Public routes: only ACTIVE products are returned.
 */
router.get(
  "/public",
  validateRequest({
    query: listProductsSchema.shape.query,
  }),
  listPublicProductsController,
);

router.get(
  "/public/slug/:slug",
  validateRequest({
    params: productSlugParamsSchema.shape.params,
  }),
  getProductBySlugController,
);

/*
 * Administrative routes.
 */
router.get(
  "/",
  adminAuth,
  requirePermissionMatch("products.read"),
  validateRequest({
    query: listProductsSchema.shape.query,
  }),
  listProductsController,
);

router.get(
  "/:id",
  adminAuth,
  requirePermissionMatch("products.read"),
  validateRequest({
    params: productIdParamsSchema.shape.params,
  }),
  getProductController,
);

router.post(
  "/",
  adminAuth,
  requirePermissionMatch("products.create"),
  validateRequest({
    body: createProductSchema.shape.body,
  }),
  createProductController,
);

router.patch(
  "/:id",
  adminAuth,
  requirePermissionMatch("products.update"),
  validateRequest({
    params: updateProductSchema.shape.params,
    body: updateProductSchema.shape.body,
  }),
  updateProductController,
);

router.patch(
  "/:id/status",
  adminAuth,
  requirePermissionMatch("products.update"),
  validateRequest({
    params: updateProductStatusSchema.shape.params,
    body: updateProductStatusSchema.shape.body,
  }),
  updateProductStatusController,
);

router.delete(
  "/:id",
  adminAuth,
  requirePermissionMatch("products.delete"),
  validateRequest({
    params: productIdParamsSchema.shape.params,
  }),
  archiveProductController,
);

export default router;
