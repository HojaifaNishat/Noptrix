import { Router } from "express";

import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";

import { validate } from "../../middlewares/validation.middleware";

import {
  createSupplierController,
  deactivateSupplierController,
  getSupplierByCodeController,
  getSupplierController,
  getSupplierSummaryController,
  listSuppliersController,
  updateSupplierController,
  updateSupplierStatusController,
} from "./supplier.controller";

import {
  createSupplierSchema,
  supplierIdSchema,
  supplierQuerySchema,
  updateSupplierSchema,
  updateSupplierStatusSchema,
} from "./supplier.validator";

const router = Router();

router.use(adminAuth, adminSecretVerified);

// Dashboard summary
router.get("/summary", getSupplierSummaryController);

// Supplier list and creation
router.get(
  "/",
  validate(supplierQuerySchema, "query"),
  listSuppliersController,
);

router.post(
  "/",
  validate(createSupplierSchema),
  createSupplierController,
);

// Lookup by supplier code
router.get("/code/:code", getSupplierByCodeController);

// Supplier details
router.get(
  "/:id",
  validate(supplierIdSchema, "params"),
  getSupplierController,
);

// Supplier update
router.patch(
  "/:id",
  validate(supplierIdSchema, "params"),
  validate(updateSupplierSchema),
  updateSupplierController,
);

// Explicit status transition
router.patch(
  "/:id/status",
  validate(supplierIdSchema, "params"),
  validate(updateSupplierStatusSchema),
  updateSupplierStatusController,
);

// Soft deactivation
router.delete(
  "/:id",
  validate(supplierIdSchema, "params"),
  deactivateSupplierController,
);

export default router;
