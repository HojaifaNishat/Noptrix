import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  cancelCustomerReturnController,
  createReturnController,
  getCustomerReturnController,
  listCustomerReturnsController,
} from "./return.controller";

import {
  createReturnSchema,
  returnIdParamsSchema,
  returnQuerySchema,
} from "./return.validator";

const router = Router();

/**
 * Customer return routes
 * Mount behind the project's API prefix.
 */
router.use(userAuth);

router.post("/", validate(createReturnSchema), createReturnController);

router.get(
  "/",
  validate(returnQuerySchema, "query"),
  listCustomerReturnsController,
);

router.get(
  "/:returnId",
  validate(returnIdParamsSchema, "params"),
  getCustomerReturnController,
);

router.post(
  "/:returnId/cancel",
  validate(returnIdParamsSchema, "params"),
  cancelCustomerReturnController,
);

export default router;
