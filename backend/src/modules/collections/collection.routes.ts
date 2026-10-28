import { Router, type RequestHandler } from "express";

import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import { hasPermission } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  addCollectionProductsController,
  createCollectionController,
  deleteCollectionController,
  getCollectionByIdController,
  getPublicCollectionBySlugController,
  listAdminCollectionsController,
  listPublicCollectionsController,
  removeCollectionProductsController,
  updateCollectionController,
} from "./collection.controller";

import {
  collectionIdParamsSchema,
  collectionListQuerySchema,
  collectionProductIdsSchema,
  collectionSlugParamsSchema,
  createCollectionSchema,
  updateCollectionSchema,
} from "./collection.validator";

const router = Router();

/**
 * Keep permission keys consistent with the keys defined
 * in your NOPTRIX permissions seed data.
 */
function permission(key: string): RequestHandler {
  return (req, res, next) => {
    if (!hasPermission(req, key)) {
      res.status(403).json({
        success: false,
        message: `Permission denied: ${key}`,
      });
      return;
    }

    next();
  };
}

const adminSecurity = [adminAuth, adminSecretVerified] as const;

/**
 * Public storefront routes
 */

// GET /collections
router.get(
  "/",
  validate(collectionListQuerySchema, "query"),
  listPublicCollectionsController,
);

// GET /collections/slug/summer-sale
router.get(
  "/slug/:slug",
  validate(collectionSlugParamsSchema, "params"),
  getPublicCollectionBySlugController,
);

/**
 * Admin routes
 * Register static paths before /:id.
 */

// GET /collections/admin
router.get(
  "/admin",
  ...adminSecurity,
  permission("collections.read"),
  validate(collectionListQuerySchema, "query"),
  listAdminCollectionsController,
);

// POST /collections
router.post(
  "/",
  ...adminSecurity,
  permission("collections.create"),
  validate(createCollectionSchema, "body"),
  createCollectionController,
);

// GET /collections/:id
router.get(
  "/:id",
  ...adminSecurity,
  permission("collections.read"),
  validate(collectionIdParamsSchema, "params"),
  getCollectionByIdController,
);

// PATCH /collections/:id
router.patch(
  "/:id",
  ...adminSecurity,
  permission("collections.update"),
  validate(collectionIdParamsSchema, "params"),
  validate(updateCollectionSchema, "body"),
  updateCollectionController,
);

// POST /collections/:id/products
router.post(
  "/:id/products",
  ...adminSecurity,
  permission("collections.update"),
  validate(collectionIdParamsSchema, "params"),
  validate(collectionProductIdsSchema, "body"),
  addCollectionProductsController,
);

// DELETE /collections/:id/products
router.delete(
  "/:id/products",
  ...adminSecurity,
  permission("collections.update"),
  validate(collectionIdParamsSchema, "params"),
  validate(collectionProductIdsSchema, "body"),
  removeCollectionProductsController,
);

// DELETE /collections/:id
router.delete(
  "/:id",
  ...adminSecurity,
  permission("collections.delete"),
  validate(collectionIdParamsSchema, "params"),
  deleteCollectionController,
);

export default router;
