import { Router } from "express";

import { ShippingController } from "./shipping.controller";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";

const router = Router();

// Public tracking endpoint: returns only the selected tracking fields.
router.get("/track/:trackingNumber", ShippingController.track);

// All remaining endpoints require owner/admin authentication.
router.use(ownerOrAdminAuth);

router.post("/", ShippingController.create);
router.get("/", ShippingController.list);

router.get("/:id", ShippingController.getById);
router.patch("/:id/status", ShippingController.updateStatus);
router.patch("/:id/assign-rider", ShippingController.assignRider);
router.patch("/:id/cancel", ShippingController.cancel);

export default router;
