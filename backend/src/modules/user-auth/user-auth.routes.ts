import { Router } from "express";

import {
  authRateLimiter,
  otpRateLimiter,
} from "../../middlewares/rateLimit.middleware";

import { authenticate } from "../../middlewares/auth.middleware";

import { validate } from "../../middlewares/validation.middleware";

import {
  register,
  login,
  refreshToken,
  logout,
  verifyRegistrationEmail,
} from "./user-auth.controller";

import {
  userRegistrationSchema,
  userLoginSchema,
  userRefreshTokenSchema,
} from "./user-auth.validator";
import { createPasswordRecoveryHandlers } from "../password-recovery/password-recovery.controller";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../password-recovery/password-recovery.validator";

const router = Router();
const { forgotPasswordController, resetPasswordController } =
  createPasswordRecoveryHandlers("USER");

/*
|--------------------------------------------------------------------------
| User Registration
|--------------------------------------------------------------------------
| POST /api/user-auth/register
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  authRateLimiter,
  validate(userRegistrationSchema),
  register,
);

/*
|--------------------------------------------------------------------------
| Public Email Verification
|--------------------------------------------------------------------------
*/

router.post("/verify-email", authRateLimiter, verifyRegistrationEmail);

/*
|--------------------------------------------------------------------------
| User Login
|--------------------------------------------------------------------------
| POST /api/user-auth/login
|--------------------------------------------------------------------------
*/

router.post("/login", authRateLimiter, validate(userLoginSchema), login);

router.post(
  "/forgot-password",
  otpRateLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController,
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  resetPasswordController,
);

/*
|--------------------------------------------------------------------------
| Refresh Access Token
|--------------------------------------------------------------------------
| POST /api/user-auth/refresh
|--------------------------------------------------------------------------
*/

router.post(
  "/refresh",
  authRateLimiter,
  validate(userRefreshTokenSchema),
  refreshToken,
);

/*
|--------------------------------------------------------------------------
| User Logout
|--------------------------------------------------------------------------
| POST /api/user-auth/logout
|--------------------------------------------------------------------------
*/

router.post("/logout", authenticate, logout);

export default router;
