import { Router } from "express";
import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  createRatingController,
  deleteRatingController,
  getMyProductRatingController,
  getProductRatingSummaryController,
  listProductRatingsController,
  updateRatingController,
} from "./rating.controller";
import {
  createRatingSchema,
  ratingIdParamsSchema,
  ratingListQuerySchema,
  ratingProductParamsSchema,
  updateRatingSchema,
} from "./rating.validator";

const router = Router();

// Public product rating reads.
router.get(
  "/products/:productId/summary",
  validate(ratingProductParamsSchema, "params"),
  getProductRatingSummaryController,
);

router.get(
  "/products/:productId",
  validate(ratingProductParamsSchema, "params"),
  validate(ratingListQuerySchema, "query"),
  listProductRatingsController,
);

// All mutations and personal rating lookup require user authentication.
router.get(
  "/products/:productId/me",
  userAuth,
  validate(ratingProductParamsSchema, "params"),
  getMyProductRatingController,
);

router.post(
  "/",
  userAuth,
  validate(createRatingSchema),
  createRatingController,
);

router.patch(
  "/:ratingId",
  userAuth,
  validate(ratingIdParamsSchema, "params"),
  validate(updateRatingSchema),
  updateRatingController,
);

router.delete(
  "/:ratingId",
  userAuth,
  validate(ratingIdParamsSchema, "params"),
  deleteRatingController,
);

export default router;
