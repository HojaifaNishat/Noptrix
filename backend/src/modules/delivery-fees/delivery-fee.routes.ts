import { Router } from "express";

import { DeliveryFeeController } from "./delivery-fee.controller";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";

const router = Router();

// Public endpoints for checkout calculations.
router.post("/calculate", DeliveryFeeController.calculate);
router.get("/slug/:slug", DeliveryFeeController.getBySlug);

// Management endpoints.
router.use(ownerOrAdminAuth);

router.post("/", DeliveryFeeController.create);
router.get("/", DeliveryFeeController.list);
router.get("/:id", DeliveryFeeController.getById);
router.patch("/:id", DeliveryFeeController.update);
router.patch("/:id/status", DeliveryFeeController.setStatus);
router.delete("/:id", DeliveryFeeController.remove);

export default router;
