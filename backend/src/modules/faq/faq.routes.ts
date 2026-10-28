import { Router, type RequestHandler } from "express";
import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import {
  listFaqCategoriesController,
  listAdminFaqCategoriesController,
  createFaqCategoryController,
  updateFaqCategoryController,
  deleteFaqCategoryController,
  listFaqsController,
  getFaqController,
  listAdminFaqsController,
  createFaqController,
  updateFaqController,
  deleteFaqController,
  publishFaqController,
} from "./faq.controller";

const router = Router();

const requireFaqManagement: RequestHandler = (req, res, next) => {
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

  if (!hasPermissionMatch(req, "support.manage")) {
    res.status(403).json({
      success: false,
      message: "Missing permission: support.manage",
    });
    return;
  }

  next();
};

/* Public FAQ endpoints */
router.get("/categories", listFaqCategoriesController);
router.get("/faqs", listFaqsController);
router.get("/faqs/:id", getFaqController);

/* Admin FAQ category management */
router.get(
  "/admin/categories",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  listAdminFaqCategoriesController,
);
router.post(
  "/admin/categories",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  createFaqCategoryController,
);
router.patch(
  "/admin/categories/:id",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  updateFaqCategoryController,
);
router.delete(
  "/admin/categories/:id",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  deleteFaqCategoryController,
);

/* Admin FAQ management */
router.get(
  "/admin/faqs",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  listAdminFaqsController,
);
router.post(
  "/admin/faqs",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  createFaqController,
);
router.patch(
  "/admin/faqs/:id",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  updateFaqController,
);
router.patch(
  "/admin/faqs/:id/publish",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  publishFaqController,
);
router.delete(
  "/admin/faqs/:id",
  adminAuth,
  adminSecretVerified,
  requireFaqManagement,
  deleteFaqController,
);

export default router;
