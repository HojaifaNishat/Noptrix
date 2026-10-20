import { Router, type RequestHandler } from "express";
import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { hasPermissionMatch } from "../../middlewares/permission.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  activateWarehouseController,
  createWarehouseController,
  deactivateWarehouseController,
  getWarehouseController,
  listWarehousesController,
  updateWarehouseController,
} from "./warehouse.controller";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseIdSchema,
  warehouseListQuerySchema,
} from "./warehouse.validator";

const router = Router();

const requireWarehousePermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
    const admin = req.adminAuth;

    // OWNER bypass is consistent with the existing project permission pattern.
    if (admin?.role === "OWNER") {
      next();
      return;
    }

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Authenticated admin context is missing.",
      });
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

router.use(adminAuth, adminSecretVerified);

router.get(
  "/",
  requireWarehousePermission("warehouses.read"),
  validate(warehouseListQuerySchema, "query"),
  listWarehousesController,
);

router.get(
  "/:id",
  requireWarehousePermission("warehouses.read"),
  validate(warehouseIdSchema, "params"),
  getWarehouseController,
);

router.post(
  "/",
  requireWarehousePermission("warehouses.create"),
  validate(createWarehouseSchema),
  createWarehouseController,
);

router.patch(
  "/:id",
  requireWarehousePermission("warehouses.update"),
  validate(warehouseIdSchema, "params"),
  validate(updateWarehouseSchema),
  updateWarehouseController,
);

router.post(
  "/:id/activate",
  requireWarehousePermission("warehouses.update"),
  validate(warehouseIdSchema, "params"),
  activateWarehouseController,
);

router.delete(
  "/:id",
  requireWarehousePermission("warehouses.delete"),
  validate(warehouseIdSchema, "params"),
  deactivateWarehouseController,
);

export default router;
