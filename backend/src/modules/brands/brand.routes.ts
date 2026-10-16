import {
  Router,
  type RequestHandler,
} from "express";

import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import {
  hasPermissionMatch,
} from "../../middlewares/permission.middleware";

import {
  validate,
} from "../../middlewares/validation.middleware";

import {
  uploadImage,
} from "../../middlewares/upload.middleware";

import {
  MultipartParseError,
  parseMultipartBoolean,
  parseMultipartJsonObject,
  parseMultipartNumber,
} from "../../utils/parseMultipart";

import {
  createBrandController,
  getBrandController,
  getBrandBySlugController,
  listBrandsController,
  listActiveBrandsController,
  updateBrandController,
  updateBrandStatusController,
  updateBrandSortOrderController,
  deleteBrandController,
} from "./brand.controller";

import {
  createBrandSchema,
  updateBrandSchema,
  brandIdParamSchema,
  brandSlugParamSchema,
  brandListQuerySchema,
  updateBrandStatusSchema,
  updateBrandSortOrderSchema,
} from "./brand.validator";

const router = Router();

const normalizeBrandMultipart: RequestHandler = (req, res, next) => {
  try {
    const body = {
      ...(req.body as Record<string, unknown>),
    };

    if ("removeLogo" in body) {
      body.removeLogo = parseMultipartBoolean(body.removeLogo);
    }

    if ("sortOrder" in body) {
      body.sortOrder = parseMultipartNumber(body.sortOrder);
    }

    if ("seo" in body) {
      body.seo = parseMultipartJsonObject(body.seo);
    }

    req.body = body;
    next();
  } catch (error) {
    if (error instanceof MultipartParseError) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    next(error);
  }
};

const requireBrandPermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
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
        code: "BRAND_PERMISSION_DENIED",
      });
      return;
    }

    next();
  };
};

const adminOnly = [adminAuth, adminSecretVerified];

/*
 * Public storefront routes.
 * Only active brands are exposed publicly.
 */
router.get(
  "/",
  listActiveBrandsController,
);

router.get(
  "/active",
  listActiveBrandsController,
);

router.get(
  "/slug/:slug",
  validate(brandSlugParamSchema, "params"),
  getBrandBySlugController,
);

/*
 * Admin list.
 * Kept before /:brandId to avoid path collisions.
 */
router.get(
  "/admin",
  ...adminOnly,
  requireBrandPermission("brands.read"),
  validate(brandListQuerySchema, "query"),
  listBrandsController,
);

router.post(
  "/",
  ...adminOnly,
  requireBrandPermission("brands.create"),
  uploadImage.single("logo"),
  normalizeBrandMultipart,
  validate(createBrandSchema, "body"),
  createBrandController,
);

router.patch(
  "/:brandId/status",
  ...adminOnly,
  requireBrandPermission("brands.update"),
  validate(brandIdParamSchema, "params"),
  validate(updateBrandStatusSchema, "body"),
  updateBrandStatusController,
);

router.patch(
  "/:brandId/sort-order",
  ...adminOnly,
  requireBrandPermission("brands.update"),
  validate(brandIdParamSchema, "params"),
  validate(updateBrandSortOrderSchema, "body"),
  updateBrandSortOrderController,
);

router.get(
  "/:brandId",
  ...adminOnly,
  requireBrandPermission("brands.read"),
  validate(brandIdParamSchema, "params"),
  getBrandController,
);

router.patch(
  "/:brandId",
  ...adminOnly,
  requireBrandPermission("brands.update"),
  uploadImage.single("logo"),
  normalizeBrandMultipart,
  validate(brandIdParamSchema, "params"),
  validate(updateBrandSchema, "body"),
  updateBrandController,
);

router.delete(
  "/:brandId",
  ...adminOnly,
  requireBrandPermission("brands.delete"),
  validate(brandIdParamSchema, "params"),
  deleteBrandController,
);

export default router;