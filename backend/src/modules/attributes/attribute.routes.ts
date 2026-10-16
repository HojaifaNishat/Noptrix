import { Router, type RequestHandler } from "express";
import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  createAttributeController,
  deleteAttributeController,
  getAttributeController,
  getAttributeBySlugController,
  listAttributesController,
  listActiveAttributesController,
  updateAttributeController,
  updateAttributeStatusController,
  updateAttributeSortOrderController,
} from "./attribute.controller";
import {
  createAttributeSchema,
  updateAttributeSchema,
  attributeIdParamSchema,
  attributeSlugParamSchema,
  attributeListQuerySchema,
  updateAttributeStatusSchema,
  updateAttributeSortOrderSchema,
} from "./attribute.validator";

const router = Router();

const requireAttributePermission = (permission: string): RequestHandler =>
  (req, res, next) => {
    const admin = req.adminAuth;

    if (!admin?.adminId) {
      res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
      return;
    }

    if (admin.role?.trim().toUpperCase() === "OWNER") {
      next();
      return;
    }

    req.permissions = Object.freeze([...(admin.permissions ?? [])]);

    if (!hasPermissionMatch(req, permission)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
        code: "ATTRIBUTE_PERMISSION_DENIED",
      });
      return;
    }

    next();
  };

const adminOnly = [adminAuth, adminSecretVerified];

// Public storefront: active attributes only.
router.get("/", listActiveAttributesController);
router.get("/active", listActiveAttributesController);
router.get(
  "/slug/:slug",
  validate(attributeSlugParamSchema, "params"),
  getAttributeBySlugController,
);

// Admin endpoints.
router.get(
  "/admin",
  ...adminOnly,
  requireAttributePermission("attributes.read"),
  validate(attributeListQuerySchema, "query"),
  listAttributesController,
);

router.post(
  "/",
  ...adminOnly,
  requireAttributePermission("attributes.create"),
  validate(createAttributeSchema, "body"),
  createAttributeController,
);

router.patch(
  "/:attributeId/status",
  ...adminOnly,
  requireAttributePermission("attributes.update"),
  validate(attributeIdParamSchema, "params"),
  validate(updateAttributeStatusSchema, "body"),
  updateAttributeStatusController,
);

router.patch(
  "/:attributeId/sort-order",
  ...adminOnly,
  requireAttributePermission("attributes.update"),
  validate(attributeIdParamSchema, "params"),
  validate(updateAttributeSortOrderSchema, "body"),
  updateAttributeSortOrderController,
);

router.get(
  "/:attributeId",
  ...adminOnly,
  requireAttributePermission("attributes.read"),
  validate(attributeIdParamSchema, "params"),
  getAttributeController,
);

router.patch(
  "/:attributeId",
  ...adminOnly,
  requireAttributePermission("attributes.update"),
  validate(attributeIdParamSchema, "params"),
  validate(updateAttributeSchema, "body"),
  updateAttributeController,
);

router.delete(
  "/:attributeId",
  ...adminOnly,
  requireAttributePermission("attributes.delete"),
  validate(attributeIdParamSchema, "params"),
  deleteAttributeController,
);

export default router;
