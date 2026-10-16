import { Router, type RequestHandler } from "express";
import { adminAuth, adminSecretVerified } from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { tagCreateSchema, tagUpdateSchema, mongoIdParamSchema, assignTagSchema, productTagAssignmentParamSchema, productIdParamSchema } from "../products/product.validator";
import * as c from "./tag.controller";

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
router.get("/", c.listTagsController);
router.get("/product/:productId", validate(productIdParamSchema, "params"), c.listProductTagsController);
router.post("/", ...admin, permission("products.create"), validate(tagCreateSchema, "body"), c.createTagController);
router.patch("/:id", ...admin, permission("products.update"), validate(mongoIdParamSchema, "params"), validate(tagUpdateSchema, "body"), c.updateTagController);
router.delete("/:id", ...admin, permission("products.delete"), validate(mongoIdParamSchema, "params"), c.deleteTagController);
router.post("/assign", ...admin, permission("products.update"), validate(assignTagSchema, "body"), c.assignTagController);
router.delete("/product/:productId/tag/:tagId", ...admin, permission("products.update"), validate(productTagAssignmentParamSchema, "params"), c.unassignTagController);
export default router;
