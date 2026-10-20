import { Router } from "express";
import {
  ownerAuth,
  ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import * as controller from "./promotion.controller";
import {
  createPromotionSchema,
  promotionIdParamSchema,
  promotionQuerySchema,
  promotionStatusSchema,
  updatePromotionSchema,
} from "./promotion.validator";

const router = Router();

// Public read-only endpoint for currently active promotions.
router.get("/public", controller.getPublicPromotions);
router.get(
  "/public/slug/:slug",
  controller.getPromotionBySlug,
);

// Management endpoints: owner authentication and secret verification required.
router.use(ownerAuth, ownerSecretVerified);

router.post(
  "/",
  validate(createPromotionSchema),
  controller.createPromotion,
);

router.get(
  "/",
  validate(promotionQuerySchema, "query"),
  controller.getAllPromotions,
);

router.get(
  "/:promotionId",
  validate(promotionIdParamSchema, "params"),
  controller.getPromotionById,
);

router.patch(
  "/:promotionId",
  validate(promotionIdParamSchema, "params"),
  validate(updatePromotionSchema),
  controller.updatePromotion,
);

router.patch(
  "/:promotionId/status",
  validate(promotionIdParamSchema, "params"),
  validate(promotionStatusSchema),
  controller.changePromotionStatus,
);

router.delete(
  "/:promotionId",
  validate(promotionIdParamSchema, "params"),
  controller.deletePromotion,
);

export default router;
