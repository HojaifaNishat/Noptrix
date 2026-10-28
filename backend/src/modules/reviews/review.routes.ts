import { Router } from "express";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import { userAuth } from "../../middlewares/userAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  createReviewController,
  deleteMyReviewController,
  getMyReviewsController,
  getProductReviewsController,
  moderateReviewController,
  updateMyReviewController,
} from "./review.controller";
import { reviewIdParamsSchema, moderateReviewSchema } from "./review.validator";

const router = Router();

// Public: only approved reviews are returned.
router.get("/products/:productId", getProductReviewsController);

router.patch(
  "/:reviewId/moderation",
  ownerOrAdminAuth,
  validate(reviewIdParamsSchema, "params"),
  validate(moderateReviewSchema),
  moderateReviewController,
);

// Customer-authenticated routes.
router.use(userAuth);
router.post("/", createReviewController);
router.get("/me", getMyReviewsController);
router.patch("/:reviewId", updateMyReviewController);
router.delete("/:reviewId", deleteMyReviewController);

export default router;
