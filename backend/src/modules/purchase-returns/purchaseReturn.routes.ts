import { Router } from "express";

import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  approvePurchaseReturnController,
  cancelPurchaseReturnController,
  completePurchaseReturnController,
  createPurchaseReturnController,
  getPurchaseReturnByNumberController,
  getPurchaseReturnController,
  getPurchaseReturnSummaryController,
  listPurchaseReturnsController,
  recordPurchaseReturnRefundController,
  rejectPurchaseReturnController,
  updatePurchaseReturnController,
} from "./purchaseReturn.controller";

import {
  approvePurchaseReturnSchema,
  cancelPurchaseReturnSchema,
  completePurchaseReturnSchema,
  createPurchaseReturnSchema,
  purchaseReturnIdSchema,
  purchaseReturnNumberSchema,
  purchaseReturnQuerySchema,
  purchaseReturnSummaryQuerySchema,
  recordPurchaseReturnRefundSchema,
  rejectPurchaseReturnSchema,
  updatePurchaseReturnSchema,
} from "./purchaseReturn.validator";

const router = Router();

router.use(adminAuth, adminSecretVerified);

// Summary and listing
router.get(
  "/summary",
  validate(purchaseReturnSummaryQuerySchema, "query"),
  getPurchaseReturnSummaryController,
);

router.get(
  "/",
  validate(purchaseReturnQuerySchema, "query"),
  listPurchaseReturnsController,
);

// Create a return request
router.post(
  "/",
  validate(createPurchaseReturnSchema),
  createPurchaseReturnController,
);

// Find by return number (before /:id)
router.get(
  "/number/:returnNumber",
  validate(purchaseReturnNumberSchema, "params"),
  getPurchaseReturnByNumberController,
);

// Read one return
router.get(
  "/:id",
  validate(purchaseReturnIdSchema, "params"),
  getPurchaseReturnController,
);

// Update a requested return
router.patch(
  "/:id",
  validate(purchaseReturnIdSchema, "params"),
  validate(updatePurchaseReturnSchema),
  updatePurchaseReturnController,
);

// Approve
router.post(
  "/:id/approve",
  validate(purchaseReturnIdSchema, "params"),
  validate(approvePurchaseReturnSchema),
  approvePurchaseReturnController,
);

// Reject
router.post(
  "/:id/reject",
  validate(purchaseReturnIdSchema, "params"),
  validate(rejectPurchaseReturnSchema),
  rejectPurchaseReturnController,
);

// Complete and deduct restockable items from inventory
router.post(
  "/:id/complete",
  validate(purchaseReturnIdSchema, "params"),
  validate(completePurchaseReturnSchema),
  completePurchaseReturnController,
);

// Record supplier refund
router.post(
  "/:id/refunds",
  validate(purchaseReturnIdSchema, "params"),
  validate(recordPurchaseReturnRefundSchema),
  recordPurchaseReturnRefundController,
);

// Cancel
router.post(
  "/:id/cancel",
  validate(purchaseReturnIdSchema, "params"),
  validate(cancelPurchaseReturnSchema),
  cancelPurchaseReturnController,
);

export default router;
