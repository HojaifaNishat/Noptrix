import { Router } from "express";

import {
  detailedHealthController,
  livenessController,
  readinessController,
} from "./health.controller";

const router = Router();

router.get("/", detailedHealthController);
router.get("/live", livenessController);
router.get("/ready", readinessController);

export const healthRoutes = router;
export default router;
