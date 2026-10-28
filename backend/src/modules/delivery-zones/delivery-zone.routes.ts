import { Router } from "express";

import { DeliveryZoneController } from "./delivery-zone.controller";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";

const router = Router();

/**
 * Public endpoints
 * Customers can check service availability without logging in.
 */
router.get("/check", DeliveryZoneController.checkAvailability);

router.get("/slug/:slug", DeliveryZoneController.getBySlug);

/**
 * Management endpoints
 */
router.use(ownerOrAdminAuth);

router.post("/", DeliveryZoneController.create);
router.get("/", DeliveryZoneController.list);

router.get("/:id", DeliveryZoneController.getById);

router.patch("/:id", DeliveryZoneController.update);

router.patch("/:id/status", DeliveryZoneController.setStatus);

router.delete("/:id", DeliveryZoneController.remove);

export default router;
