import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  createCancellationController,
  getCustomerCancellationController,
  listCustomerCancellationsController,
} from "./cancellation.controller";

import {
  cancellationIdParamsSchema,
  cancellationQuerySchema,
  createCancellationSchema,
} from "./cancellation.validator";

const router = Router();

router.use(userAuth);

/**
 * POST /cancellations
 * Request cancellation of an order.
 */
router.post(
  "/",
  validate(createCancellationSchema),
  createCancellationController,
);

/**
 * GET /cancellations
 * List the authenticated customer's cancellation requests.
 */
router.get(
  "/",
  validate(cancellationQuerySchema, "query"),
  listCustomerCancellationsController,
);

/**
 * GET /cancellations/:cancellationId
 * Get one cancellation request.
 */
router.get(
  "/:cancellationId",
  validate(cancellationIdParamsSchema, "params"),
  getCustomerCancellationController,
);

export default router;
