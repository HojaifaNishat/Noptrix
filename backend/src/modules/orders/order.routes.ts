import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  createOrderController,
  getCustomerOrderController,
  listCustomerOrdersController,
} from "./order.controller";

import {
  createOrderSchema,
  orderIdParamsSchema,
  orderQuerySchema,
} from "./order.validator";

const router = Router();

router.use(userAuth);

/**
 * POST /orders
 * Create an order from a completed checkout session.
 */
router.post(
  "/",
  validate(createOrderSchema),
  createOrderController,
);

/**
 * GET /orders
 * List the authenticated customer's orders.
 */
router.get(
  "/",
  validate(orderQuerySchema, "query"),
  listCustomerOrdersController,
);

/**
 * GET /orders/:orderId
 * Get one order belonging to the authenticated customer.
 */
router.get(
  "/:orderId",
  validate(orderIdParamsSchema, "params"),
  getCustomerOrderController,
);

export default router;
