import { Router } from "express";
import { adminAuth, adminSecretVerified } from "../../middlewares/adminAuth.middleware";
import { requireEmployeePermission } from "../employees/employee-authorization.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
    submitApplicationController,
    getAllApplicationsController,
    getApplicationController,
    updateApplicationStatusController,
    deleteApplicationController,
} from "./application.controller";
import {
    createApplicationSchema,
    updateApplicationStatusSchema,
    applicationIdParamSchema,
} from "./application.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
    "/apply",
    validate(createApplicationSchema, "body"),
    submitApplicationController
);

/*
|--------------------------------------------------------------------------
| Admin Protected Routes
|--------------------------------------------------------------------------
*/

router.get(
    "/admin/applications",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.read"),
    getAllApplicationsController
);

router.get(
    "/admin/applications/:id",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.read"),
    validate(applicationIdParamSchema, "params"),
    getApplicationController
);

router.patch(
    "/admin/applications/:id/status",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.update"),
    validate(applicationIdParamSchema, "params"),
    validate(updateApplicationStatusSchema, "body"),
    updateApplicationStatusController
);

router.delete(
    "/admin/applications/:id",
    adminAuth,
    adminSecretVerified,
    requireEmployeePermission("employees.delete"),
    validate(applicationIdParamSchema, "params"),
    deleteApplicationController
);

export default router;
