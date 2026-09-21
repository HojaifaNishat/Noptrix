import {
    Router,
} from "express";

import {
    createUserController,
    getCurrentUserController,
    getUserController,
    updateCurrentUserController,
    changeCurrentUserPasswordController,
    updateUserStatusController,
} from "./user.controller";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    authRateLimiter,
} from "../../middlewares/rateLimit.middleware";

import {
    createUserSchema,
    updateUserSchema,
    changePasswordSchema,
    userIdParamSchema,
    updateUserStatusSchema,
} from "./user.validator";

const router =
    Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

/**
 * Create a new user
 *
 * POST /api/users
 */
router.post(
    "/",
    authRateLimiter,
    validate(
        createUserSchema,
        "body"
    ),
    createUserController
);

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/

/**
 * Get current authenticated user
 *
 * GET /api/users/me
 */
router.get(
    "/me",
    userAuth,
    getCurrentUserController
);

/**
 * Update current authenticated user
 *
 * PATCH /api/users/me
 */
router.patch(
    "/me",
    userAuth,
    validate(
        updateUserSchema,
        "body"
    ),
    updateCurrentUserController
);

/**
 * Change current user's password
 *
 * PATCH /api/users/me/password
 */
router.patch(
    "/me/password",
    userAuth,
    authRateLimiter,
    validate(
        changePasswordSchema,
        "body"
    ),
    changeCurrentUserPasswordController
);

/*
|--------------------------------------------------------------------------
| User Lookup
|--------------------------------------------------------------------------
*/

/**
 * Get user by ID
 *
 * GET /api/users/:userId
 */
router.get(
    "/:userId",
    userAuth,
    validate(
        userIdParamSchema,
        "params"
    ),
    getUserController
);

/*
|--------------------------------------------------------------------------
| User Status
|--------------------------------------------------------------------------
 */

/**
 * Update user status
 *
 * PATCH /api/users/:userId/status
 *
 * NOTE:
 * Permission protection will be added
 * after Roles + Permissions module.
 */
router.patch(
    "/:userId/status",
    userAuth,
    validate(
        userIdParamSchema,
        "params"
    ),
    validate(
        updateUserStatusSchema,
        "body"
    ),
    updateUserStatusController
);

export default router;