import { Router } from "express";

import {
    adminAuth,
} from "../../middlewares/adminAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    loginAdminController,
    refreshAdminTokenController,
    logoutAdminController,
    verifyAdminSecretController,
} from "./admin-auth.controller";

import {
    adminLoginSchema,
    adminRefreshTokenSchema,
    adminSecretVerifySchema,
} from "./admin-auth.validator";


const router = Router();


/*
|--------------------------------------------------------------------------
| Public Admin Authentication
|--------------------------------------------------------------------------
*/

/**
 * POST /admin-auth/login
 *
 * Admin login.
 *
 * Separate from customer/user authentication.
 */
router.post(
    "/login",
    validate(
        adminLoginSchema,
        "body",
    ),
    loginAdminController,
);


/**
 * POST /admin-auth/refresh
 *
 * Rotate admin access/refresh tokens.
 */
router.post(
    "/refresh",
    validate(
        adminRefreshTokenSchema,
        "body",
    ),
    refreshAdminTokenController,
);


/*
|--------------------------------------------------------------------------
| Protected Admin Authentication
|--------------------------------------------------------------------------
*/

/**
 * POST /admin-auth/logout
 *
 * Requires a valid admin access token.
 */
router.post(
    "/logout",
    adminAuth,
    logoutAdminController,
);


/**
 * POST /admin-auth/verify-secret
 *
 * Verifies the admin's secondary secret.
 *
 * The route itself is protected by admin authentication.
 * The service will perform the actual secret verification.
 */
router.post(
    "/verify-secret",
    adminAuth,
    validate(
        adminSecretVerifySchema,
        "body",
    ),
    verifyAdminSecretController,
);


export default router;