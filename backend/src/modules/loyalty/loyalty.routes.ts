import { Router } from "express";
import { userAuth } from "../../middlewares/userAuth.middleware";
import { ownerOrAdminAuth } from "../../middlewares/ownerOrAdminAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { updateLoyaltyProgramSchema } from "./loyalty.validator";
import {
  getLoyaltyProgramController,
  updateLoyaltyProgramController,
  getMyLoyaltyMembershipController,
} from "./loyalty.controller";

const router = Router();

/* Public program information. */
router.get("/program", getLoyaltyProgramController);

/* Customer's own membership and tier. */
router.get("/me", userAuth, getMyLoyaltyMembershipController);

/* Admin / Owner management. */
router.get("/admin/program", ownerOrAdminAuth, getLoyaltyProgramController);

router.patch(
  "/admin/program",
  ownerOrAdminAuth,
  validate(updateLoyaltyProgramSchema, "body"),
  updateLoyaltyProgramController,
);

export default router;
