import { Router } from "express";

import { userAuth } from "../../middlewares/userAuth.middleware";

import {
  applyReferral,
  getMyReferralCode,
  getReferralHistory,
  getReferralSummary,
} from "./referral.controller";

const router = Router();

router.use(userAuth);

router.get("/me/code", getMyReferralCode);
router.get("/me/summary", getReferralSummary);
router.get("/me/history", getReferralHistory);
router.post("/apply", applyReferral);

export default router;
