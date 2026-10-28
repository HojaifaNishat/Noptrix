import { Router } from "express";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import {
  validate,
  validateRequest,
} from "../../middlewares/validation.middleware";
import {
  createFlashSaleController,
  deleteFlashSaleController,
  getFlashSaleController,
  listActiveFlashSalesController,
  listFlashSalesController,
  updateFlashSaleController,
} from "./flash-sale.controller";
import {
  createFlashSaleSchema,
  flashSaleIdParamsSchema,
  flashSaleListQuerySchema,
  updateFlashSaleSchema,
} from "./flash-sale.validator";

const router = Router();

// Public endpoint must be registered before /:flashSaleId.
router.get("/active", listActiveFlashSalesController);

// All management endpoints require owner/admin authentication.
router.use(ownerOrAdminAuth);

router.get(
  "/",
  validateRequest({ query: flashSaleListQuerySchema.shape.query }),
  listFlashSalesController,
);

router.post(
  "/",
  validateRequest({ body: createFlashSaleSchema.shape.body }),
  createFlashSaleController,
);

router.get(
  "/:flashSaleId",
  validate(flashSaleIdParamsSchema, "params"),
  getFlashSaleController,
);

router.patch(
  "/:flashSaleId",
  validateRequest({
    params: updateFlashSaleSchema.shape.params,
    body: updateFlashSaleSchema.shape.body,
  }),
  updateFlashSaleController,
);

router.delete(
  "/:flashSaleId",
  validate(flashSaleIdParamsSchema, "params"),
  deleteFlashSaleController,
);

export default router;
