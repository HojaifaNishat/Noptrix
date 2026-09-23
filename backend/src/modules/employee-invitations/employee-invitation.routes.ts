import { Router } from "express";
import { adminAuth, adminSecretVerified } from "../../middlewares/adminAuth.middleware";
import { requireEmployeePermission } from "../employees/employee-authorization.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { acceptEmployeeInvitationController, createEmployeeInvitationController } from "./employee-invitation.controller";
import { acceptEmployeeInvitationSchema, createEmployeeInvitationSchema } from "./employee-invitation.validator";

const router = Router();

router.post(
    "/",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.create"),
    validate(createEmployeeInvitationSchema, "body"),
    createEmployeeInvitationController
);

router.post(
    "/accept",
    validate(acceptEmployeeInvitationSchema, "body"),
    acceptEmployeeInvitationController
);

export default router;