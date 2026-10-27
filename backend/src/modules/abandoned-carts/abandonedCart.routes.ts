
import { Router } from "express";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  abandonedCartAnalyticsController,
  listAbandonedCartsController,
  recoverAbandonedCartController,
} from "./abandonedCart.controller";
import {
  abandonedCartListQuerySchema,
  recoverAbandonedCartSchema,
} from "./abandonedCart.validator";

const router = Router();

// Public endpoint: possession of the high-entropy, expiring token is required.
router.post(
  "/recover",
  validate(recoverAbandonedCartSchema),
  recoverAbandonedCartController,
);

// Management/analytics endpoints.
router.get(
  "/admin/analytics",
  ownerOrAdminAuth,
  abandonedCartAnalyticsController,
);

router.get(
  "/admin",
  ownerOrAdminAuth,
  validate(abandonedCartListQuerySchema, "query"),
  listAbandonedCartsController,
);

export default router;
