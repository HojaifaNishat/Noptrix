import { Router } from "express";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import { userAuth } from "../../middlewares/userAuth.middleware";
import {
  validate,
  validateRequest,
} from "../../middlewares/validation.middleware";

import {
  createCouponController,
  deleteCouponController,
  getCouponController,
  listCouponsController,
  updateCouponController,
  validateCouponController,
} from "./coupon.controller";

import {
  couponIdParamsSchema,
  couponListQuerySchema,
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "./coupon.validator";

const router = Router();

// Customer coupon validation
router.post(
  "/validate",
  userAuth,
  validateRequest({ body: validateCouponSchema.shape.body }),
  validateCouponController,
);

// Owner/Admin coupon management
router.use(ownerOrAdminAuth);

router.post(
  "/",
  validateRequest({ body: createCouponSchema.shape.body }),
  createCouponController,
);

router.get(
  "/",
  validateRequest({ query: couponListQuerySchema.shape.query }),
  listCouponsController,
);

router.get(
  "/:couponId",
  validate(couponIdParamsSchema, "params"),
  getCouponController,
);

router.patch(
  "/:couponId",
  validateRequest({
    params: updateCouponSchema.shape.params,
    body: updateCouponSchema.shape.body,
  }),
  updateCouponController,
);

router.delete(
  "/:couponId",
  validate(couponIdParamsSchema, "params"),
  deleteCouponController,
);

export default router;
