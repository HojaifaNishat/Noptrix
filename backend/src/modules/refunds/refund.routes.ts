import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  createRefundController,
  getCustomerRefundController,
} from "./refund.controller";

import { createRefundSchema, refundIdParamsSchema } from "./refund.validator";

const router = Router();

/**
 * Customer refund routes.
 * Customer may request a refund only for an eligible cancellation/return.
 */
router.use(userAuth);

router.post("/", validate(createRefundSchema), createRefundController);

router.get(
  "/:refundId",
  validate(refundIdParamsSchema, "params"),
  getCustomerRefundController,
);

export default router;
