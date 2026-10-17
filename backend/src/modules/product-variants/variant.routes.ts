import { Router } from "express";

import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { requirePermissionMatch } from "../../middlewares/permission.middleware";
import { validateRequest } from "../../middlewares/validation.middleware";

import {
  createVariantController,
  deleteVariantController,
  getVariantController,
  listVariantsController,
  updateVariantController,
} from "./variant.controller";

import {
  productIdParamSchema,
  variantCreateSchema,
  variantIdParamsSchema,
  variantListQuerySchema,
  variantUpdateSchema,
} from "./variant.validator";

const router = Router();

router.use(adminAuth);

router.get(
  "/:productId",
  requirePermissionMatch("products.read"),
  validateRequest({
    params: productIdParamSchema.shape.params,
    query: variantListQuerySchema.shape.query,
  }),
  listVariantsController,
);

router.post(
  "/:productId",
  requirePermissionMatch("products.create"),
  validateRequest({
    params: variantCreateSchema.shape.params,
    body: variantCreateSchema.shape.body,
  }),
  createVariantController,
);

router.get(
  "/:productId/:id",
  requirePermissionMatch("products.read"),
  validateRequest({
    params: variantIdParamsSchema.shape.params,
  }),
  getVariantController,
);

router.patch(
  "/:productId/:id",
  requirePermissionMatch("products.update"),
  validateRequest({
    params: variantUpdateSchema.shape.params,
    body: variantUpdateSchema.shape.body,
  }),
  updateVariantController,
);

router.delete(
  "/:productId/:id",
  requirePermissionMatch("products.delete"),
  validateRequest({
    params: variantIdParamsSchema.shape.params,
  }),
  deleteVariantController,
);

export default router;
