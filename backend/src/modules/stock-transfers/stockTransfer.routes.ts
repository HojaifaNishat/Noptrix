import { Router } from "express";

import {
  adminAuth,
  adminSecretVerified,
} from "../../middlewares/adminAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  approveStockTransferController,
  cancelStockTransferController,
  createStockTransferController,
  dispatchStockTransferController,
  getStockTransferController,
  listStockTransfersController,
  receiveStockTransferController,
  rejectStockTransferController,
} from "./stockTransfer.controller";

import {
  createStockTransferSchema,
  stockTransferIdSchema,
  stockTransferQuerySchema,
  stockTransferActionSchema,
} from "./stockTransfer.validator";

const router = Router();

router.use(adminAuth, adminSecretVerified);

router.get(
  "/",
  validate(stockTransferQuerySchema, "query"),
  listStockTransfersController,
);

router.post(
  "/",
  validate(createStockTransferSchema),
  createStockTransferController,
);

router.get(
  "/:id",
  validate(stockTransferIdSchema, "params"),
  getStockTransferController,
);

router.post(
  "/:id/approve",
  validate(stockTransferIdSchema, "params"),
  validate(stockTransferActionSchema),
  approveStockTransferController,
);

router.post(
  "/:id/reject",
  validate(stockTransferIdSchema, "params"),
  validate(stockTransferActionSchema),
  rejectStockTransferController,
);

router.post(
  "/:id/dispatch",
  validate(stockTransferIdSchema, "params"),
  validate(stockTransferActionSchema),
  dispatchStockTransferController,
);

router.post(
  "/:id/receive",
  validate(stockTransferIdSchema, "params"),
  validate(stockTransferActionSchema),
  receiveStockTransferController,
);

router.post(
  "/:id/cancel",
  validate(stockTransferIdSchema, "params"),
  validate(stockTransferActionSchema),
  cancelStockTransferController,
);

export default router;
