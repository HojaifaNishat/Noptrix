import {
    Router,
} from "express";

import {
    authRateLimiter,
    otpRateLimiter,
} from "../../middlewares/rateLimit.middleware";

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
    resendAdminLoginCodeController,
    verifyAdminLoginController,
    verifyAdminSecretController,
} from "./admin-auth.controller";

import {
    adminLoginSchema,
    adminLoginVerificationSchema,
    resendAdminLoginVerificationSchema,
    adminRefreshTokenSchema,
    adminSecretVerifySchema,
} from "./admin-auth.validator";
import { createPasswordRecoveryHandlers } from "../password-recovery/password-recovery.controller";
import {
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../password-recovery/password-recovery.validator";


const router =
      Router();
const {
    forgotPasswordController,
    resetPasswordController,
} = createPasswordRecoveryHandlers("ADMIN");


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

    authRateLimiter,

    validate(
        adminLoginSchema,
        "body",
    ),

    loginAdminController,
);

router.post(
    "/forgot-password",
    otpRateLimiter,
    validate(forgotPasswordSchema, "body"),
    forgotPasswordController,
);

router.post(
    "/reset-password",
    authRateLimiter,
    validate(resetPasswordSchema, "body"),
    resetPasswordController,
);

router.post(
    "/verify-login",
    authRateLimiter,
    validate(adminLoginVerificationSchema, "body"),
    verifyAdminLoginController,
);

router.post(
    "/resend-login-code",
    authRateLimiter,
    validate(resendAdminLoginVerificationSchema, "body"),
    resendAdminLoginCodeController,
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
