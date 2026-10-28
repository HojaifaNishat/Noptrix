import { Router } from "express";

import {
  ownerAuth,
  ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  acceptAdminInvitationController,
  createAdminInvitationController,
  requestAdminInvitationOtpController,
  validateAdminInvitationController,
} from "./admin-invitation.controller";
import {
  acceptAdminInvitationSchema,
  adminInvitationTokenSchema,
  createAdminInvitationSchema,
  requestAdminInvitationOtpSchema,
} from "./admin-invitation.validator";

const router = Router();

router.post(
  "/",
  ownerAuth,
  ownerSecretVerified,
  validate(createAdminInvitationSchema, "body"),
  createAdminInvitationController,
);

router.get(
  "/validate",
  validate(adminInvitationTokenSchema, "query"),
  validateAdminInvitationController,
);

router.post(
  "/accept/send-code",
  validate(requestAdminInvitationOtpSchema, "body"),
  requestAdminInvitationOtpController,
);

router.post(
  "/accept",
  validate(acceptAdminInvitationSchema, "body"),
  acceptAdminInvitationController,
);

export default router;
