import { Router } from "express";

import { sellerAuth } from "../../middlewares/sellerAuth.middleware";

import {
  getSellerOrderController,
  listSellerOrdersController,
} from "./seller-order.controller";

import { validate } from "../../middlewares/validation.middleware";

import {
  sellerOrderIdParamSchema,
  sellerOrderQuerySchema,
} from "./seller-order.validator";

const router = Router();

/**
 * GET /seller-orders
 * List orders containing the authenticated seller's items.
 */
router.get("/", sellerAuth, listSellerOrdersController);

/**
 * GET /seller-orders/:orderId
 * Get the authenticated seller's portion of an order.
 */
router.get("/:orderId", sellerAuth, getSellerOrderController);

export default router;