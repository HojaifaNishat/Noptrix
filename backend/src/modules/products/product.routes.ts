import { Router, type RequestHandler } from "express";
import { adminAuth, adminSecretVerified } from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";
import * as c from "./product.controller";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productSlugParamSchema,
  productListQuerySchema,
  productStatusSchema,
} from "./product.validator";

const router = Router();

const permission = (key: string): RequestHandler => (req, res, next) => {
  const admin = req.adminAuth;
  if (!admin?.adminId) {
    res.status(401).json({ success: false, message: "Admin authentication required." });
    return;
  }
  if (admin.role?.trim().toUpperCase() === "OWNER") {
    next();
    return;
  }
  req.permissions = Object.freeze([...(admin.permissions ?? [])]);
  if (!hasPermissionMatch(req, key)) {
    res.status(403).json({
      success: false,
      message: "Insufficient permission.",
      code: "PRODUCT_PERMISSION_DENIED",
    });
    return;
  }
  next();
};

const adminOnly = [adminAuth, adminSecretVerified];

router.get("/", validate(productListQuerySchema, "query"), c.listProductsController);
router.get("/slug/:slug", validate(productSlugParamSchema, "params"), c.getProductBySlugController);
router.get("/admin/list", ...adminOnly, permission("products.read"), validate(productListQuerySchema, "query"), c.listAdminProductsController);
router.post("/", ...adminOnly, permission("products.create"), validate(createProductSchema, "body"), c.createProductController);
router.get("/:productId", ...adminOnly, permission("products.read"), validate(productIdParamSchema, "params"), c.getProductController);
router.patch("/:productId", ...adminOnly, permission("products.update"), validate(productIdParamSchema, "params"), validate(updateProductSchema, "body"), c.updateProductController);
router.patch("/:productId/status", ...adminOnly, permission("products.update"), validate(productIdParamSchema, "params"), validate(productStatusSchema, "body"), c.updateProductStatusController);
router.delete("/:productId", ...adminOnly, permission("products.delete"), validate(productIdParamSchema, "params"), c.deleteProductController);

export default router;
