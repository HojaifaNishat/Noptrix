import { Router, type RequestHandler } from "express";
import { adminAuth, adminSecretVerified } from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { variantCreateSchema, variantUpdateSchema, mongoIdParamSchema, productIdParamSchema } from "../products/product.validator";
import * as c from "./variant.controller";

const router = Router();
const permission = (key: string): RequestHandler => (req, res, next) => {
    const admin = req.adminAuth;
    if (!admin?.adminId) { res.status(401).json({ success: false, message: "Admin authentication required." }); return; }
    if (admin.role?.trim().toUpperCase() === "OWNER") { next(); return; }
    req.permissions = Object.freeze([...(admin.permissions ?? [])]);
    if (!hasPermissionMatch(req, key)) { res.status(403).json({ success: false, message: "Insufficient permission." }); return; }
    next();
};
const admin = [adminAuth, adminSecretVerified];
router.get("/product/:productId", validate(productIdParamSchema, "params"), c.listVariantsController);
router.post("/", ...admin, permission("products.create"), validate(variantCreateSchema, "body"), c.createVariantController);
router.patch("/:id", ...admin, permission("products.update"), validate(mongoIdParamSchema, "params"), validate(variantUpdateSchema, "body"), c.updateVariantController);
router.delete("/:id", ...admin, permission("products.delete"), validate(mongoIdParamSchema, "params"), c.deleteVariantController);
export default router;
