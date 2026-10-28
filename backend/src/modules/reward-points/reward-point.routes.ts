import { Router } from "express";
import { userAuth } from "../../middlewares/userAuth.middleware";
import {
  getRewardPointBalanceController,
  getRewardPointHistoryController,
  redeemRewardPointsController,
} from "./reward-point.controller";

const router = Router();

router.use(userAuth);

router.get("/me", getRewardPointBalanceController);
router.get("/me/history", getRewardPointHistoryController);
router.post("/redeem", redeemRewardPointsController);

export default router;
