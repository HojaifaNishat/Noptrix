import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  addCartItemController,
  clearCartController,
  getCartController,
  refreshCartPricesController,
  removeCartItemController,
  removeCartProductController,
  updateCartItemController,
} from "./cart.controller";

import {
  addCartItemSchema,
  cartItemParamsSchema,
  cartProductParamsSchema,
  cartVariantParamsSchema,
  updateCartItemSchema,
} from "./cart.validator";

const router = Router();

router.use(userAuth);

router.get("/", getCartController);

router.post("/items", validate(addCartItemSchema), addCartItemController);

router.patch(
  "/items/:itemId",
  validate(cartItemParamsSchema, "params"),
  validate(updateCartItemSchema),
  updateCartItemController,
);

router.delete(
  "/items/:itemId",
  validate(cartItemParamsSchema, "params"),
  removeCartItemController,
);

router.delete("/items", clearCartController);

router.delete(
  "/products/:productId/variants/:variantId",
  validate(cartVariantParamsSchema, "params"),
  removeCartProductController,
);

router.delete(
  "/products/:productId",
  validate(cartProductParamsSchema, "params"),
  removeCartProductController,
);

router.post("/refresh-prices", refreshCartPricesController);

export default router;
