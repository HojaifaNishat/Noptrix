import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  cancelCheckoutController,
  createCheckoutController,
  getCheckoutByTokenController,
  getCheckoutController,
  listCheckoutsController,
} from "./checkout.controller";

import {
  checkoutIdParamsSchema,
  checkoutQuerySchema,
  checkoutTokenParamsSchema,
  createCheckoutSchema,
} from "./checkout.validator";

const router = Router();

router.use(userAuth);

// Create checkout
router.post(
  "/",
  validate(createCheckoutSchema),
  createCheckoutController,
);

// List customer's checkouts
router.get(
  "/",
  validate(checkoutQuerySchema, "query"),
  listCheckoutsController,
);

// Get checkout by token
router.get(
  "/token/:checkoutToken",
  validate(checkoutTokenParamsSchema, "params"),
  getCheckoutByTokenController,
);

// Cancel checkout
router.patch(
  "/:checkoutId/cancel",
  validate(checkoutIdParamsSchema, "params"),
  cancelCheckoutController,
);

// Get checkout by ID
router.get(
  "/:checkoutId",
  validate(checkoutIdParamsSchema, "params"),
  getCheckoutController,
);

export default router;
