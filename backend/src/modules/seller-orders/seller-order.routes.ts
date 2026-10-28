import { Router } from "express";

import { sellerAuth } from "../../middlewares/sellerAuth.middleware";

import {
  getSellerOrderController,
  listSellerOrdersController,
} from "./seller-order.controller";

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
