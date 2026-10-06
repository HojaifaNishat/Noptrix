import {
    Router,
} from "express";

import {
    adminAuth,
} from "../../middlewares/adminAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    loginAdminController,
    refreshAdminTokenController,
    getMyAdminAuthController,
    logoutAdminController,
    verifyAdminSecretController,
} from "./admin-auth.controller";

import {
    adminLoginSchema,
    adminRefreshTokenSchema,
    adminSecretVerifySchema,
} from "./admin-auth.validator";


const router =
    Router();


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
 * Refresh token is stored in an
 * httpOnly cookie.
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
 * Refresh token is read from
 * the httpOnly cookie.
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
 * GET /admin-auth/me
 *
 * Returns the currently authenticated
 * Admin user.
 */
router.get(
    "/me",

    adminAuth,

    getMyAdminAuthController,
);


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
 * Verifies the Admin secondary secret.
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
