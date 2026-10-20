import { Router } from "express";

import { DeliveryController } from "./delivery.controller";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";

const router = Router();

// Owner/admin endpoints
router.use(ownerOrAdminAuth);

router.post("/", DeliveryController.create);
router.get("/", DeliveryController.list);
router.get("/my-deliveries", DeliveryController.myDeliveries);
router.get("/:id", DeliveryController.getById);

router.patch("/:id/assign-rider", DeliveryController.assignRider);
router.patch("/:id/status", DeliveryController.updateStatus);
router.patch("/:id/cancel", DeliveryController.cancel);

export default router;