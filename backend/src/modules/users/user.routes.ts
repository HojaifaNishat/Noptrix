import { Router } from "express";

import {
  getCurrentUserController,
  getUserController,
  updateCurrentUserController,
  changeCurrentUserPasswordController,
  updateUserStatusController,
} from "./user.controller";

import { validate } from "../../middlewares/validation.middleware";

import { userAuth } from "../../middlewares/userAuth.middleware";
import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { requirePermission } from "../../middlewares/permission.middleware";

import { authRateLimiter } from "../../middlewares/rateLimit.middleware";

import {
  updateUserSchema,
  changePasswordSchema,
  userIdParamSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} from "./user.validator";

import { listUsersController } from "./user.controller";

const router = Router();

/*
|--------------------------------------------------------------------------
| Admin User Listing
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  adminAuth,
  requirePermission("users.read"),
  validate(listUsersQuerySchema, "query"),
  listUsersController,
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
router.get("/me", userAuth, getCurrentUserController);

/**
 * Update current authenticated user
 *
 * PATCH /api/users/me
 */
router.patch(
  "/me",
  userAuth,
  validate(updateUserSchema, "body"),
  updateCurrentUserController,
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
  validate(changePasswordSchema, "body"),
  changeCurrentUserPasswordController,
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
  validate(userIdParamSchema, "params"),
  getUserController,
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
 * Requires the users.update permission.
 */
router.patch(
  "/:userId/status",
  adminAuth,
  requirePermission("users.update"),
  validate(userIdParamSchema, "params"),
  validate(updateUserStatusSchema, "body"),
  updateUserStatusController,
);

export default router;
