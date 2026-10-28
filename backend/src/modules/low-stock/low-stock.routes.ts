import { Router, type RequestHandler } from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  listLowStockController,
  lowStockSummaryController,
} from "./low-stock.controller";
import { lowStockQuerySchema } from "./low-stock.validator";

const router = Router();

const requireInventoryRead: RequestHandler = (req, res, next) => {
  const admin = req.adminAuth;

  if (!admin) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (admin.role === "OWNER") {
    next();
    return;
  }

  req.permissions = Object.freeze([...(admin.permissions ?? [])]);

  if (!hasPermissionMatch(req, "inventory.read")) {
    res.status(403).json({
      success: false,
      message: "Permission denied.",
    });
    return;
  }

  next();
};

router.use(adminAuth, requireInventoryRead);

router.get(
  "/summary",
  validate(lowStockQuerySchema, "query"),
  lowStockSummaryController,
);

router.get("/", validate(lowStockQuerySchema, "query"), listLowStockController);

export default router;
