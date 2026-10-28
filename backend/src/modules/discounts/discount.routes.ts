import { Router } from "express";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import {
  validate,
  validateRequest,
} from "../../middlewares/validation.middleware";
import {
  createDiscountController,
  deleteDiscountController,
  getDiscountController,
  listDiscountsController,
  listPublicDiscountsController,
  updateDiscountController,
} from "./discount.controller";
import {
  createDiscountSchema,
  discountIdParamsSchema,
  discountListQuerySchema,
  updateDiscountSchema,
} from "./discount.validator";

const router = Router();

// Public endpoint: only currently active discounts are returned.
router.get("/public", listPublicDiscountsController);

// Management endpoints.
router.use(ownerOrAdminAuth);
router.get(
  "/",
  validateRequest({ query: discountListQuerySchema.shape.query }),
  listDiscountsController,
);
router.post(
  "/",
  validateRequest({ body: createDiscountSchema.shape.body }),
  createDiscountController,
);
router.get(
  "/:discountId",
  validate(discountIdParamsSchema, "params"),
  getDiscountController,
);
router.patch(
  "/:discountId",
  validateRequest({
    params: updateDiscountSchema.shape.params,
    body: updateDiscountSchema.shape.body,
  }),
  updateDiscountController,
);
router.delete(
  "/:discountId",
  validate(discountIdParamsSchema, "params"),
  deleteDiscountController,
);

export default router;
