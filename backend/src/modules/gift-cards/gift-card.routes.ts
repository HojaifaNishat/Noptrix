import { Router } from "express";
import { userAuth } from "../../middlewares/userAuth.middleware";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import {
  validate,
  validateRequest,
} from "../../middlewares/validation.middleware";
import {
  createGiftCardController,
  getGiftCardController,
  giftCardBalanceController,
  listGiftCardsController,
  updateGiftCardStatusController,
} from "./gift-card.controller";
import {
  createGiftCardSchema,
  giftCardBalanceSchema,
  giftCardIdParamsSchema,
  giftCardListQuerySchema,
  giftCardStatusSchema,
} from "./gift-card.validator";

const router = Router();

// Require customer authentication to reduce gift-card code enumeration.
router.post(
  "/balance",
  userAuth,
  validateRequest({ body: giftCardBalanceSchema.shape.body }),
  giftCardBalanceController,
);

// Management endpoints.
router.use(ownerOrAdminAuth);

router.get(
  "/",
  validateRequest({ query: giftCardListQuerySchema.shape.query }),
  listGiftCardsController,
);

router.post(
  "/",
  validateRequest({ body: createGiftCardSchema.shape.body }),
  createGiftCardController,
);

router.get(
  "/:giftCardId",
  validate(giftCardIdParamsSchema, "params"),
  getGiftCardController,
);

router.patch(
  "/:giftCardId/status",
  validateRequest({
    params: giftCardStatusSchema.shape.params,
    body: giftCardStatusSchema.shape.body,
  }),
  updateGiftCardStatusController,
);

export default router;
