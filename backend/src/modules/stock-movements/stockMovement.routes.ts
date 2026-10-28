import { Router, type RequestHandler } from "express";

import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  createStockMovementController,
  getStockMovementController,
  listStockMovementsController,
} from "./stockMovement.controller";

import {
  createStockMovementSchema,
  stockMovementParamsSchema,
  stockMovementQuerySchema,
} from "./stockMovement.validator";

const router = Router();

router.use(adminAuth, adminSecretVerified);

const requireStockMovementPermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
    const admin = req.adminAuth;

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Administrative authentication is required.",
      });
      return;
    }

    if (admin.role?.toUpperCase() === "OWNER") {
      next();
      return;
    }

    req.permissions = Object.freeze([...(admin.permissions ?? [])]);

    if (!hasPermissionMatch(req, permission)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
      return;
    }

    next();
  };
};

router.get(
  "/",
  requireStockMovementPermission("stock-movements.read"),
  validate(stockMovementQuerySchema, "query"),
  listStockMovementsController,
);

router.get(
  "/:id",
  requireStockMovementPermission("stock-movements.read"),
  validate(stockMovementParamsSchema, "params"),
  getStockMovementController,
);

router.post(
  "/",
  requireStockMovementPermission("stock-movements.create"),
  validate(createStockMovementSchema, "body"),
  createStockMovementController,
);

export default router;
