import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";

import {
  addWishlistItemController,
  archiveWishlistController,
  clearWishlistController,
  createWishlistController,
  deleteWishlistController,
  getOrCreateDefaultWishlistController,
  getWishlistController,
  listWishlistsController,
  removeWishlistItemController,
  removeWishlistProductController,
  setDefaultWishlistController,
  updateWishlistController,
} from "./wishlist.controller";

import {
  addWishlistItemSchema,
  createWishlistSchema,
  updateWishlistSchema,
  wishlistIdSchema,
  wishlistItemParamsSchema,
  wishlistProductParamsSchema,
  wishlistQuerySchema,
} from "./wishlist.validator";

const router = Router();

router.use(userAuth);

// Default wishlist — register before dynamic wishlist routes.
router.get("/default", getOrCreateDefaultWishlistController);

// Wishlist collection.
router.get(
  "/",
  validate(wishlistQuerySchema, "query"),
  listWishlistsController,
);

router.post(
  "/",
  validate(createWishlistSchema),
  createWishlistController,
);

// Wishlist items by product.
router.delete(
  "/:wishlistId/products/:productId/variants/:variantId",
  validate(wishlistProductParamsSchema.extend({
    variantId: wishlistIdSchema.shape.wishlistId,
  }), "params"),
  removeWishlistProductController,
);

router.delete(
  "/:wishlistId/products/:productId",
  validate(wishlistProductParamsSchema, "params"),
  removeWishlistProductController,
);

// Wishlist items by item ID.
router.post(
  "/:wishlistId/items",
  validate(wishlistIdSchema, "params"),
  validate(addWishlistItemSchema),
  addWishlistItemController,
);

router.delete(
  "/:wishlistId/items",
  validate(wishlistIdSchema, "params"),
  clearWishlistController,
);

router.delete(
  "/:wishlistId/items/:itemId",
  validate(wishlistItemParamsSchema, "params"),
  removeWishlistItemController,
);

// Wishlist actions.
router.patch(
  "/:wishlistId/default",
  validate(wishlistIdSchema, "params"),
  setDefaultWishlistController,
);

router.patch(
  "/:wishlistId/archive",
  validate(wishlistIdSchema, "params"),
  archiveWishlistController,
);

router.get(
  "/:wishlistId",
  validate(wishlistIdSchema, "params"),
  getWishlistController,
);

router.patch(
  "/:wishlistId",
  validate(wishlistIdSchema, "params"),
  validate(updateWishlistSchema),
  updateWishlistController,
);

router.delete(
  "/:wishlistId",
  validate(wishlistIdSchema, "params"),
  deleteWishlistController,
);

export default router;
