import { Router, type RequestHandler } from "express";

import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  assignTagSchema,
  listTagsQuerySchema,
  productIdParamsSchema,
  productTagAssignmentParamsSchema,
  tagCreateSchema,
  tagIdParamsSchema,
  tagUpdateSchema,
} from "./tag.validator";

import * as controller from "./tag.controller";

const router = Router();

const permission =
  (key: string): RequestHandler =>
  (req, res, next) => {
    const admin = req.adminAuth;

    if (!admin?.adminId) {
      res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
      return;
    }

    // OWNER bypasses normal permission checks.
    if (admin.role?.trim().toUpperCase() === "OWNER") {
      next();
      return;
    }

    req.permissions = Object.freeze([...(admin.permissions ?? [])]);

    if (!hasPermissionMatch(req, key)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permission.",
      });
      return;
    }

    next();
  };

const admin = [adminAuth, adminSecretVerified] as const;

// Public read endpoints.
router.get(
  "/",
  validate(listTagsQuerySchema, "query"),
  controller.listTagsController,
);

router.get(
  "/product/:productId",
  validate(productIdParamsSchema, "params"),
  controller.listProductTagsController,
);

// Protected management endpoints.
router.post(
  "/",
  ...admin,
  permission("products.create"),
  validate(tagCreateSchema, "body"),
  controller.createTagController,
);

router.patch(
  "/:id",
  ...admin,
  permission("products.update"),
  validate(tagIdParamsSchema, "params"),
  validate(tagUpdateSchema, "body"),
  controller.updateTagController,
);

router.delete(
  "/:id",
  ...admin,
  permission("products.delete"),
  validate(tagIdParamsSchema, "params"),
  controller.deleteTagController,
);

router.post(
  "/assign",
  ...admin,
  permission("products.update"),
  validate(assignTagSchema, "body"),
  controller.assignTagController,
);

router.delete(
  "/product/:productId/tag/:tagId",
  ...admin,
  permission("products.update"),
  validate(productTagAssignmentParamsSchema, "params"),
  controller.unassignTagController,
);

export default router;
